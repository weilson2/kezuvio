import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { AccountingView } from "../../packages/accounting/model";

const url = "/demo/accounting-cloud";
const origin = "http://127.0.0.1:3100";
const api = "/api/labs/accounting-cloud";
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const field = (page: Page, name: string) =>
  page.getByLabel(name, { exact: true });
async function manager(page: Page) {
  await page.goto(url);
  await field(page, "Demo role").selectOption("manager");
  await expect(field(page, "Demo role")).toBeEnabled();
  await expect(field(page, "Demo role")).toHaveValue("manager");
}
async function saved(page: Page) {
  await expect(page.locator(".labs-status")).not.toContainText("Syncing");
  await expect(page.locator(".labs-error")).toHaveCount(0);
}
async function session(request: APIRequestContext) {
  const response = await request.get(api + "/session");
  expect(response.status()).toBe(200);
  return response.json() as Promise<{
    csrf: string;
    generation: number;
    role: string;
    state: AccountingView;
  }>;
}
async function action(
  request: APIRequestContext,
  packet: Awaited<ReturnType<typeof session>>,
  type: string,
  args: Record<string, unknown>,
) {
  const response = await request.post(api + "/action", {
    headers: { Origin: origin },
    data: {
      type,
      args,
      csrf: packet.csrf,
      generation: packet.generation,
      requestId: crypto.randomUUID(),
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  return response.json();
}

test("invoice, partial receipt, credit and controlled reversal reconcile through reports and refresh", async ({
  page,
}) => {
  test.setTimeout(90000);
  await manager(page);
  const initial = await session(page.request);
  const before = initial.state.reports;
  await button(page, "Transactions").click();
  await field(page, "Transaction kind").selectOption("Invoice");
  await field(page, "Customer").selectOption("customer-1");
  await field(page, "Amount (RM)").fill("200.00");
  await field(page, "Transaction memo").fill(
    "Fictional additional design invoice",
  );
  await button(page, "Post transaction").click();
  await saved(page);
  let packet = await session(page.request);
  const document = packet.state.documents.find(
    (item) =>
      !initial.state.documents.some((original) => original.id === item.id),
  );
  expect(document).toBeTruthy();
  const id = document!.id;
  expect(packet.state.reports.incomeSen).toBe(before.incomeSen + 20000);
  expect(packet.state.reports.receivableSen).toBe(before.receivableSen + 20000);
  await button(page, "Documents").click();
  const card = page.getByTestId(`accounting-document-${id}`);
  await card
    .getByRole("button", { name: "Record receipt", exact: true })
    .click();
  await card
    .getByLabel("Settlement amount (RM)", { exact: true })
    .fill("100.00");
  await card
    .getByRole("button", { name: "Post settlement", exact: true })
    .click();
  await saved(page);
  packet = await session(page.request);
  const receipt = packet.state.journals.find(
    (item) => item.kind === "Receipt" && item.sourceId === id,
  );
  expect(receipt).toBeTruthy();
  expect(packet.state.reports.cashSen).toBe(before.cashSen + 10000);
  expect(packet.state.reports.receivableSen).toBe(before.receivableSen + 10000);
  await card
    .getByRole("button", { name: "Apply credit note", exact: true })
    .click();
  await card
    .getByLabel("Settlement amount (RM)", { exact: true })
    .fill("40.00");
  await card
    .getByLabel("Credit reason", { exact: true })
    .fill("Fictional unused design allowance");
  await card
    .getByRole("button", { name: "Post credit note", exact: true })
    .click();
  await saved(page);
  packet = await session(page.request);
  expect(packet.state.reports.receivableSen).toBe(before.receivableSen + 6000);
  expect(packet.state.reports.incomeSen).toBe(before.incomeSen + 16000);
  expect(packet.state.reports.balanceDifferenceSen).toBe(0);
  await button(page, "Journals").click();
  const journal = page.getByTestId(`accounting-journal-${receipt!.id}`);
  await journal
    .getByRole("button", { name: "Reverse journal", exact: true })
    .click();
  await journal
    .getByLabel("Reversal reason", { exact: true })
    .fill("Fictional receipt entered twice by operator");
  await journal
    .getByRole("button", { name: "Post reversal", exact: true })
    .click();
  await saved(page);
  await expect(journal.locator(".badge")).toHaveText("Reversed");
  packet = await session(page.request);
  expect(packet.state.reports.cashSen).toBe(before.cashSen);
  expect(packet.state.reports.receivableSen).toBe(before.receivableSen + 16000);
  expect(
    packet.state.journals.some((item) => item.reversalOf === receipt!.id),
  ).toBe(true);
  expect(
    packet.state.journals.filter((item) => item.id === receipt!.id),
  ).toHaveLength(1);
  await button(page, "Reports").click();
  await field(page, "Report from").fill(packet.state.today);
  await field(page, "Report to").fill(packet.state.today);
  await button(page, "Apply report dates").click();
  const profitAndLoss = page
    .getByRole("heading", { name: "Profit & loss", exact: true })
    .locator("..");
  await expect(profitAndLoss).toContainText(/RM\s*160\.00/);
  await expect(
    page.getByRole("region", {
      name: "Trial balance · closing balances",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Reconciled financial reports" }),
  ).toBeVisible();
  await page.reload();
  await expect(field(page, "Demo role")).toHaveValue("manager");
  expect((await session(page.request)).state.reports.receivableSen).toBe(
    before.receivableSen + 16000,
  );
  await field(page, "Demo role").selectOption("viewer");
  await expect(field(page, "Demo role")).toBeEnabled();
  await expect(button(page, "Journals")).toHaveCount(0);
  const redacted = await session(page.request);
  for (const key of [
    "journals",
    "documents",
    "parties",
    "bankTransactions",
    "inventory",
    "history",
  ] as const)
    expect(redacted.state[key]).toEqual([]);
  expect(redacted.state.reports.profitSen).toBe(before.profitSen + 16000);
});

test("inventory costing, manual journal and exact bank matching update the books without fabricated reconciliation", async ({
  page,
}) => {
  test.setTimeout(90000);
  await manager(page);
  const initial = await session(page.request);
  const startingStock = initial.state.inventory.find(
    (item) => item.id === "chair",
  )!;
  await button(page, "Inventory").click();
  await field(page, "Purchase quantity").fill("1");
  await field(page, "Unit cost (RM)").fill("100.02");
  await button(page, "Post stock purchase").click();
  await saved(page);
  let packet = await session(page.request);
  expect(packet.state.inventory[0].quantity).toBe(startingStock.quantity + 1);
  expect(packet.state.inventory[0].valueSen).toBe(
    startingStock.valueSen + 10002,
  );
  await field(page, "Sale quantity").fill("1");
  await field(page, "Unit selling price (RM)").fill("200.00");
  await button(page, "Post stock sale").click();
  await saved(page);
  packet = await session(page.request);
  const expectedCost = Math.floor(
    ((startingStock.valueSen + 10002) * 2 + startingStock.quantity + 1) /
      ((startingStock.quantity + 1) * 2),
  );
  expect(packet.state.inventory[0].valueSen).toBe(
    startingStock.valueSen + 10002 - expectedCost,
  );
  expect(packet.state.reports.inventoryValueSen).toBe(
    packet.state.inventory[0].valueSen,
  );
  await button(page, "Journals").click();
  await field(page, "Journal memo").fill("Fictional owner cash adjustment");
  await field(page, "Line 1 account").selectOption("bank");
  await field(page, "Line 1 debit (RM)").fill("25.00");
  await field(page, "Line 2 account").selectOption("capital");
  await field(page, "Line 2 credit (RM)").fill("25.00");
  await button(page, "Post adjustment").click();
  await saved(page);
  packet = await session(page.request);
  expect(packet.state.journals.at(-1)?.kind).toBe("Adjustment");
  expect(packet.state.reports.totalDebitSen).toBe(
    packet.state.reports.totalCreditSen,
  );
  expect(packet.state.reports.balanceDifferenceSen).toBe(0);
  const beforeMatch = packet.state.journals.length;
  const bankLine = packet.state.bankTransactions.find(
    (item) => !item.matchedJournalId,
  )!;
  const match = packet.state.journals.find(
    (journal) =>
      journal.lines
        .filter((line) => line.accountId === "bank")
        .reduce((sum, line) => sum + line.debitSen - line.creditSen, 0) ===
      bankLine.amountSen,
  )!;
  await button(page, "Reconcile").click();
  const bank = page.getByTestId(`accounting-bank-${bankLine.id}`);
  await bank
    .getByLabel("Matching journal", { exact: true })
    .selectOption(match.id);
  await bank
    .getByRole("button", { name: "Match bank line", exact: true })
    .click();
  await saved(page);
  await expect(bank.locator(".badge")).toHaveText("Matched");
  packet = await session(page.request);
  expect(packet.state.journals).toHaveLength(beforeMatch);
  await bank
    .getByRole("button", { name: "Unmatch bank line", exact: true })
    .click();
  await saved(page);
  expect((await session(page.request)).state.journals).toHaveLength(
    beforeMatch,
  );
});

test("Accounting reset, permissions and repeated writes remain scoped to independent visitors and products", async ({
  request,
  playwright,
}) => {
  let packet = await session(request);
  packet = await action(request, packet, "role", { role: "manager" });
  const other = await playwright.request.newContext({ baseURL: origin });
  try {
    const separate = await session(other);
    const cafeBefore = await (
      await request.get("/api/labs/cafe-pos/session")
    ).json();
    const intent = {
      type: "transaction.post",
      args: {
        kind: "Income",
        date: packet.state.today,
        memo: "Fictional isolated revenue",
        partyId: null,
        dueDate: null,
        amountSen: 12345,
      },
      csrf: packet.csrf,
      generation: packet.generation,
      requestId: crypto.randomUUID(),
    };
    const post = () =>
      request.post(api + "/action", {
        headers: { Origin: origin },
        data: intent,
      });
    const [one, two] = await Promise.all([post(), post()]);
    expect(one.status()).toBe(200);
    expect(two.status()).toBe(200);
    let changed = await session(request);
    expect(
      changed.state.journals.filter((item) => item.memo === intent.args.memo),
    ).toHaveLength(1);
    changed = await action(request, changed, "reset", {});
    expect(changed.generation).toBe(packet.generation + 1);
    expect(
      changed.state.journals.some((item) => item.memo === intent.args.memo),
    ).toBe(false);
    expect((await post()).status()).toBe(409);
    expect((await session(other)).state.reports).toEqual(
      separate.state.reports,
    );
    expect(
      (await (await request.get("/api/labs/cafe-pos/session")).json()).state,
    ).toEqual(cafeBefore.state);
    const forbidden = await other.post(api + "/action", {
      headers: { Origin: origin },
      data: { ...intent, csrf: separate.csrf, generation: separate.generation },
    });
    expect(forbidden.status()).toBe(403);
  } finally {
    await other.dispose();
  }
});

for (const width of [375, 768, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`Accounting views fit ${width}px and pass accessibility in ${theme}`, async ({
      page,
    }) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width, height: 950 });
      await page.addInitScript(
        (value) => localStorage.setItem("kezuvio-theme", value),
        theme,
      );
      await manager(page);
      for (const tab of [
        "Overview",
        "Transactions",
        "Documents",
        "Journals",
        "Reports",
        "Reconcile",
        "Inventory",
        "Accounts",
      ]) {
        await button(page, tab).click();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          tab,
        ).toBe(true);
        expect(
          await page
            .locator(".accounting-app .demo-stats strong")
            .evaluateAll((items) =>
              items.every((item) => {
                const range = document.createRange();
                range.selectNodeContents(item);
                return range.getClientRects().length <= 1;
              }),
            ),
          "Monetary summaries must remain on one readable line",
        ).toBe(true);
        const { violations } = await new AxeBuilder({ page })
          .include(".labs-workspace")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(violations, tab).toEqual([]);
      }
      await field(page, "Demo role").selectOption("viewer");
      await expect(field(page, "Demo role")).toBeEnabled();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
    });
  }
}
