import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const origin = "http://127.0.0.1:3100";
const url = "/operations";
const endpoint = "/api/operations";
const accessKey =
  process.env.OPERATIONS_TEST_KEY ||
  "kezuvio-ephemeral-operations-preview-only";
type Task = {
  id: string;
  title: string;
  role: string;
  check: string;
  status: string;
  attempts: number;
  logs: { event: string; detail: string }[];
};
type Snapshot = {
  csrf: string;
  tasks: Task[];
  roles: { id: string; name: string }[];
  metrics: { aiTokens: null; additionalPaidCostSen: number };
};
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const field = (page: Page, name: string) =>
  page.getByLabel(name, { exact: true });
async function state(request: APIRequestContext): Promise<Snapshot> {
  const response = await request.get(endpoint);
  expect(response.status()).toBe(200);
  return response.json();
}
async function post(
  request: APIRequestContext,
  snapshot: Snapshot,
  fields: Record<string, unknown>,
) {
  return request.post(endpoint, {
    headers: { Origin: origin, "X-Operations-CSRF": snapshot.csrf },
    data: fields,
  });
}
async function login(page: Page) {
  await page.goto(url);
  await expect(field(page, "Local access key")).toBeVisible();
  await field(page, "Local access key").fill(accessKey);
  await button(page, "Sign in locally").click();
  await expect(
    page.getByRole("heading", { name: "Local task coordination", exact: true }),
  ).toBeVisible();
}
async function create(page: Page, title: string) {
  await field(page, "Task title").fill(title);
  await field(page, "Assigned role").selectOption("ada");
  await field(page, "Allowed validation check").selectOption("brand");
  await field(page, "Timeout (seconds)").fill("10");
  await button(page, "Create task for approval").click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  return (await state(page.request)).tasks.find(
    (task) => task.title === title,
  )!;
}

test("authenticated task approval runs the actual brand check, records logs and handles local mock events", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto(url);
  expect((await page.request.get(endpoint)).status()).toBe(401);
  await field(page, "Local access key").fill("deliberately-wrong-preview-key");
  await button(page, "Sign in locally").click();
  await expect(
    page.locator(".operations-app .operations-error[role='alert']"),
  ).toBeVisible();
  await expect(field(page, "Local access key")).toHaveValue("");
  await field(page, "Local access key").fill(accessKey);
  await button(page, "Sign in locally").click();
  await expect(
    page.getByRole("heading", { name: "Local task coordination", exact: true }),
  ).toBeVisible();
  expect(await page.content()).not.toContain(accessKey);
  const initial = await state(page.request);
  expect(initial.roles.map((role) => role.id)).toEqual([
    "alex",
    "sam",
    "mia",
    "ada",
    "cleo",
    "ava",
  ]);
  const title = `Browser brand verification ${crypto.randomUUID()}`;
  const task = await create(page, title);
  expect(task.status).toBe("awaiting_approval");
  expect(task.attempts).toBe(0);
  const card = page.getByTestId(`operations-task-${task.id}`);
  await expect(
    card.getByRole("button", { name: "Run local check", exact: true }),
  ).toHaveCount(0);
  let snapshot = await state(page.request);
  expect(
    (
      await post(page.request, snapshot, { action: "run", id: task.id })
    ).status(),
  ).toBe(409);
  expect(
    (
      await post(page.request, snapshot, { action: "retry", id: task.id })
    ).status(),
  ).toBe(409);
  await card
    .getByRole("button", { name: "Approve local check", exact: true })
    .click();
  await expect(card.locator(".badge")).toHaveText("Approved");
  await card
    .getByRole("button", { name: "Run local check", exact: true })
    .click();
  await expect(card.locator(".badge")).toHaveText("Succeeded", {
    timeout: 30000,
  });
  snapshot = await state(page.request);
  const completed = snapshot.tasks.find((item) => item.id === task.id)!;
  expect(completed.attempts).toBe(1);
  expect(
    completed.logs.some(
      (entry) => entry.event === "succeeded" && entry.detail.includes("PASS"),
    ),
  ).toBe(true);
  expect(snapshot.metrics.aiTokens).toBeNull();
  expect(snapshot.metrics.additionalPaidCostSen).toBe(0);
  await card.locator("summary").click();
  await expect(card.locator(".operations-logs")).toContainText("PASS");
  await expect(
    card.getByRole("button", { name: "Request retry", exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await post(page.request, snapshot, { action: "retry", id: task.id })
    ).status(),
  ).toBe(409);
  await button(page, "Mock status event").click();
  await expect(page.getByRole("status")).toContainText(
    "Mock status event handled locally",
  );
  const beforeIds = new Set(
    (await state(page.request)).tasks.map((item) => item.id),
  );
  await button(page, "Mock task-create event").click();
  await expect(page.getByRole("status")).toContainText(
    "Mock task-create event recorded",
  );
  const added = (await state(page.request)).tasks.filter(
    (item) => !beforeIds.has(item.id),
  );
  expect(added).toHaveLength(1);
  expect(added[0]).toMatchObject({
    role: "ada",
    check: "brand",
    status: "awaiting_approval",
    attempts: 0,
  });
  await button(page, "Sign out").click();
  await expect(field(page, "Local access key")).toBeVisible();
  expect((await page.request.get(endpoint)).status()).toBe(401);
});

for (const width of [375, 768, 1440])
  for (const theme of ["light", "dark"]) {
    test(`Authenticated operations is usable at ${width}px in ${theme}`, async ({
      page,
    }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: 950 });
      await page.addInitScript(
        (value) => localStorage.setItem("kezuvio-theme", value),
        theme,
      );
      await login(page);
      const title = `Responsive review ${width} ${theme} ${crypto.randomUUID()}`;
      const task = await create(page, title);
      await page
        .getByTestId(`operations-task-${task.id}`)
        .locator("summary")
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(violations).toEqual([]);
      await button(page, "Sign out").click();
      await expect(field(page, "Local access key")).toBeVisible();
    });
  }
