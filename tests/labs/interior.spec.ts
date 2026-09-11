import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import type { InteriorView } from "../../packages/interior/model";
import { quoteDesign } from "../../packages/interior/helpers";

test.use({
  launchOptions: {
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  },
});
const origin = "http://127.0.0.1:3100";
const url = "/demo/interior-3d";
const api = "/api/labs/interior-3d";
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const field = (page: Page, name: string) =>
  page.getByLabel(name, { exact: true });
type Packet = {
  csrf: string;
  generation: number;
  role: string;
  state: InteriorView;
};
async function session(request: APIRequestContext): Promise<Packet> {
  const result = await request.get(api + "/session");
  expect(result.status()).toBe(200);
  return result.json();
}
async function action(
  request: APIRequestContext,
  packet: Packet,
  type: string,
  args: Record<string, unknown>,
) {
  const response = await request.post(api + "/action", {
    headers: { Origin: origin },
    data: {
      type,
      args,
      requestId: crypto.randomUUID(),
      generation: packet.generation,
      csrf: packet.csrf,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  return response.json() as Promise<Packet>;
}
const current = (packet: Packet) =>
  packet.state.designs.find(
    (design) => design.id === packet.state.selectedDesignId,
  )!;
async function saved(page: Page) {
  await expect(page.locator(".labs-status")).not.toContainText("Syncing");
  await expect(page.locator(".labs-error")).toHaveCount(0);
}
async function scene(page: Page) {
  const canvas = page.locator("canvas[data-rendered='true']");
  await expect(canvas).toBeVisible();
  await expect(button(page, "Export screenshot")).toBeEnabled();
  return canvas;
}

test("3D room, furniture configuration and illustrative costs save, duplicate and reload independently", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto(url);
  await scene(page);
  await expect(page.getByTestId("interior-total")).toHaveText(/RM\s*4,108\.00/);
  await field(page, "Wall colour").selectOption("Sage");
  await field(page, "Floor material").selectOption("Terrazzo");
  await expect(page.getByTestId("interior-total")).toHaveText(/RM\s*4,508\.00/);
  await expect(
    page.getByText(
      "Previewing changes. Apply the room or furniture controls to save them.",
    ),
  ).toBeVisible();
  await button(page, "Apply room changes").click();
  await saved(page);
  let packet = await session(page.request);
  expect(current(packet).wallColor).toBe("Sage");
  expect(current(packet).floorMaterial).toBe("Terrazzo");
  const originalId = current(packet).id;
  await button(page, "Furniture").click();
  const model = packet.state.catalog.find((item) => item.id === "chair")!;
  await button(page, `Insert ${model.name}`).click();
  await saved(page);
  packet = await session(page.request);
  const chair = current(packet).items.find(
    (item) => item.catalogId === "chair",
  )!;
  expect(chair).toBeTruthy();
  await field(page, "Position X (cm)").fill("350");
  await field(page, "Position Z (cm)").fill("250");
  await field(page, "Rotation (degrees)").selectOption("90");
  await field(page, "Furniture finish").selectOption("Walnut");
  await button(page, "Apply furniture changes").click();
  await saved(page);
  packet = await session(page.request);
  const configured = current(packet).items.find(
    (item) => item.id === chair.id,
  )!;
  expect(configured).toMatchObject({
    xCm: 350,
    zCm: 250,
    rotationDeg: 90,
    finish: "Walnut",
  });
  expect(
    quoteDesign(current(packet), packet.state.catalog).totalSen,
  ).toBeGreaterThan(450800);
  const stableVersion = current(packet).version;
  await field(page, "Position X (cm)").fill("30");
  await field(page, "Position Z (cm)").fill("30");
  await expect(
    page.locator(".interior-feedback").filter({ hasText: "overlap" }),
  ).toBeVisible();
  await button(page, "Apply furniture changes").click();
  await expect(
    page.locator(".labs-workspace .interior-error[role='alert']"),
  ).toContainText("overlap");
  expect(current(await session(page.request)).version).toBe(stableVersion);
  await button(page, "Saved layouts").click();
  await field(page, "Design name").fill("Fictional retained lounge");
  await button(page, "Save design").click();
  await saved(page);
  const originalCard = page.getByTestId(`interior-design-${originalId}`);
  await originalCard
    .getByRole("button", { name: "Duplicate design", exact: true })
    .click();
  await saved(page);
  packet = await session(page.request);
  const duplicate = current(packet);
  expect(duplicate.id).not.toBe(originalId);
  expect(duplicate.items).toHaveLength(4);
  expect(
    duplicate.items.every(
      (item) =>
        !packet.state.designs
          .find((design) => design.id === originalId)!
          .items.some((old) => old.id === item.id),
    ),
  ).toBe(true);
  await button(page, "Design").click();
  await field(page, "Wall colour").selectOption("Midnight");
  await button(page, "Apply room changes").click();
  await saved(page);
  await button(page, "Saved layouts").click();
  await originalCard
    .getByRole("button", { name: "Load design", exact: true })
    .click();
  await saved(page);
  await page.reload();
  await scene(page);
  await expect(field(page, "Wall colour")).toHaveValue("Sage");
  packet = await session(page.request);
  expect(current(packet).id).toBe(originalId);
  expect(
    packet.state.designs.find((design) => design.id === duplicate.id)
      ?.wallColor,
  ).toBe("Midnight");
  await button(page, "Furniture").click();
  await page
    .getByTestId(`interior-item-${chair.id}`)
    .getByRole("button", { name: "Remove furniture", exact: true })
    .click();
  await saved(page);
  expect(current(await session(page.request)).items).toHaveLength(3);
});

test("actual WebGL renders, camera controls change the view and PNG export downloads the scene", async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  await page.goto(url);
  const canvas = await scene(page);
  await expect
    .poll(() =>
      canvas.evaluate(
        (node) => (node as HTMLCanvasElement).toDataURL("image/png").length,
      ),
    )
    .toBeGreaterThan(4000);
  const before = await canvas.evaluate((node) =>
    (node as HTMLCanvasElement).toDataURL("image/png"),
  );
  await button(page, "Orbit right").click();
  await expect
    .poll(() =>
      canvas.evaluate((node) =>
        (node as HTMLCanvasElement).toDataURL("image/png"),
      ),
    )
    .not.toBe(before);
  await button(page, "Zoom in").click();
  await canvas.screenshot({ path: testInfo.outputPath("room-webgl.png") });
  const pendingDownload = page.waitForEvent("download");
  await button(page, "Export screenshot").click();
  const download = await pendingDownload;
  expect(download.suggestedFilename()).toBe("kezuvio-room-design.png");
  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = await readFile(path!);
  expect(bytes.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  expect(bytes.length).toBeGreaterThan(2000);
});

test("unsupported WebGL retains numeric design, saved layout and estimate controls", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return (original as (...values: unknown[]) => unknown).apply(this, [
        type,
        ...args,
      ]);
    } as typeof original;
  });
  await page.goto(url);
  await expect(
    page.getByRole("heading", { name: "3D preview unavailable", exact: true }),
  ).toBeVisible();
  await expect(button(page, "Export screenshot")).toBeDisabled();
  await field(page, "Room width (cm)").fill("550");
  await button(page, "Apply room changes").click();
  await saved(page);
  expect(current(await session(page.request)).widthCm).toBe(550);
  await button(page, "Saved layouts").click();
  await field(page, "New design name").fill("Fictional fallback bedroom");
  await field(page, "Room preset").selectOption("bedroom");
  await button(page, "Create preset room").click();
  await saved(page);
  expect(current(await session(page.request))).toMatchObject({
    name: "Fictional fallback bedroom",
    widthCm: 450,
    depthCm: 400,
    items: [],
  });
});

test("visitor permissions, duplicate request identity and resets preserve independent designs and other products", async ({
  request,
  playwright,
}) => {
  let packet = await session(request);
  const separate = await playwright.request.newContext({ baseURL: origin });
  try {
    const other = await session(separate);
    const property = await (
      await request.get("/api/labs/property-crm/session")
    ).json();
    const design = current(packet);
    const intent = {
      type: "design.duplicate",
      args: {
        id: design.id,
        version: design.version,
        name: "Fictional one-copy replay",
      },
      requestId: crypto.randomUUID(),
      generation: packet.generation,
      csrf: packet.csrf,
    };
    const post = () =>
      request.post(api + "/action", {
        headers: { Origin: origin },
        data: intent,
      });
    const [one, two] = await Promise.all([post(), post()]);
    expect(one.status()).toBe(200);
    expect(two.status()).toBe(200);
    packet = await session(request);
    expect(
      packet.state.designs.filter((row) => row.name === intent.args.name),
    ).toHaveLength(1);
    const readOnly = await action(request, packet, "role", { role: "viewer" });
    expect(readOnly.state.canEdit).toBe(false);
    const denied = await request.post(api + "/action", {
      headers: { Origin: origin },
      data: {
        ...intent,
        args: {
          id: current(readOnly).id,
          version: current(readOnly).version,
          name: "Forbidden copy",
        },
        requestId: crypto.randomUUID(),
        csrf: readOnly.csrf,
      },
    });
    expect(denied.status()).toBe(403);
    packet = await action(request, readOnly, "role", { role: "customer" });
    const reset = await action(request, packet, "reset", {});
    expect(reset.generation).toBe(packet.generation + 1);
    expect(reset.state.designs).toHaveLength(1);
    expect((await post()).status()).toBe(409);
    expect((await session(separate)).state.designs).toEqual(
      other.state.designs,
    );
    const propertyAfter = (
      await (await request.get("/api/labs/property-crm/session")).json()
    ).state;
    const { asOf: _beforeClock, ...propertyBeforeBusiness } = property.state;
    const { asOf: _afterClock, ...propertyAfterBusiness } = propertyAfter;
    expect(propertyAfterBusiness).toEqual(propertyBeforeBusiness);
  } finally {
    await separate.dispose();
  }
});

for (const width of [375, 768, 1440])
  for (const theme of ["light", "dark"]) {
    test(`Interior controls are accessible without page overflow at ${width}px in ${theme}`, async ({
      page,
    }) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width, height: 950 });
      await page.addInitScript(
        (value) => localStorage.setItem("kezuvio-theme", value),
        theme,
      );
      await page.goto(url);
      await scene(page);
      for (const area of ["Design", "Furniture", "Saved layouts", "Pricing"]) {
        await button(page, area).click();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          area,
        ).toBe(true);
        const { violations } = await new AxeBuilder({ page })
          .include(".labs-workspace")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(violations, area).toEqual([]);
      }
      await field(page, "Demo role").selectOption("viewer");
      await expect(field(page, "Demo role")).toBeEnabled();
      await button(page, "Design").click();
      await expect(button(page, "Apply room changes")).toHaveCount(0);
    });
  }
