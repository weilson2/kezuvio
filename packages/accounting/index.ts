import { randomUUID } from "node:crypto";
import {
  assertRole,
  integer,
  LabsError,
  type Action,
  type ProductModule,
} from "../demo-platform/index.ts";
import type {
  AccountingState,
  AccountingView,
  Category,
  Document,
  Journal,
  JournalKind,
  JournalLine,
} from "./model.ts";
import { accountingReports, businessDate } from "./reports.ts";
export * from "./model.ts";
export { accountingReports } from "./reports.ts";

export const accountingLimits = {
  journals: 150,
  documents: 40,
  periods: 24,
  accounts: 40,
  parties: 40,
  history: 100,
  money: 100_000_000,
  quantity: 10000,
  stateBytes: 256000,
} as const;
const controls = new Set(["receivable", "payable", "inventory"]);
function fail(message: string): never {
  throw new LabsError(409, message);
}
function fields(args: Action["args"], keys: string[]) {
  if (
    Object.keys(args).length !== keys.length ||
    keys.some((key) => !Object.hasOwn(args, key))
  )
    throw new LabsError(400, "Unexpected or missing action arguments.");
}
function text(value: unknown, label: string, max = 160) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new LabsError(400, `${label} must contain 1–${max} characters.`);
  return value.trim();
}
function date(value: unknown) {
  try {
    return businessDate(value);
  } catch {
    throw new LabsError(400, "Use a valid YYYY-MM-DD business date.");
  }
}
function money(value: unknown) {
  return integer(value, "Amount in sen", 1, accountingLimits.money);
}
function find<T extends { id: string }>(
  rows: T[],
  id: unknown,
  label: string,
): T {
  const result = rows.find((row) => row.id === text(id, `${label} ID`, 80));
  if (!result)
    throw new LabsError(404, `${label} not found in this workspace.`);
  return result;
}
function versioned<T extends { id: string; version: number }>(
  rows: T[],
  args: Action["args"],
  label: string,
): T {
  const result = find(rows, args.id, label);
  if (result.version !== integer(args.version, "Record version", 1))
    fail("This record changed. Refresh before editing.");
  return result;
}
function room(rows: unknown[], limit: number) {
  if (rows.length >= limit)
    throw new LabsError(
      429,
      "Workspace record limit reached. Reset the demo to start again.",
    );
}
function periodFor(state: AccountingState, postingDate: string) {
  const period = state.periods.find(
    (period) => period.start <= postingDate && period.end >= postingDate,
  );
  if (!period || period.closed)
    fail("Posting requires an open accounting period.");
  return period;
}
function linesFor(
  state: AccountingState,
  value: unknown,
  manual = false,
): JournalLine[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 12)
    throw new LabsError(400, "A journal needs 2–12 balanced lines.");
  const result = value.map((input) => {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new LabsError(400, "Invalid journal line.");
    const line = input as Record<string, unknown>;
    fields(line, ["accountId", "debitSen", "creditSen"]);
    const accountId = find(state.accounts, line.accountId, "Account").id;
    if (manual && controls.has(accountId))
      fail("Use a document or inventory workflow for control accounts.");
    const debitSen = integer(
        line.debitSen,
        "Debit sen",
        0,
        accountingLimits.money,
      ),
      creditSen = integer(
        line.creditSen,
        "Credit sen",
        0,
        accountingLimits.money,
      );
    if ((debitSen === 0) === (creditSen === 0))
      throw new LabsError(400, "Each line needs one nonzero debit or credit.");
    return { accountId, debitSen, creditSen };
  });
  if (result.reduce((n, line) => n + line.debitSen - line.creditSen, 0) !== 0)
    fail("Journal debits and credits must balance exactly.");
  return result;
}
const debit = (accountId: string, amount: number): JournalLine => ({
  accountId,
  debitSen: amount,
  creditSen: 0,
});
const credit = (accountId: string, amount: number): JournalLine => ({
  accountId,
  debitSen: 0,
  creditSen: amount,
});
function post(
  state: AccountingState,
  kind: JournalKind,
  postingDate: string,
  memo: string,
  lines: JournalLine[],
  now: number,
  sourceId: string | null = null,
  amountSen = 0,
  reversalOf: string | null = null,
) {
  room(state.journals, accountingLimits.journals);
  const period = periodFor(state, postingDate);
  const row: Journal = {
    id: randomUUID(),
    reference: `J-${String(state.journals.length + 1).padStart(4, "0")}`,
    date: postingDate,
    periodId: period.id,
    memo,
    kind,
    sourceId,
    amountSen,
    reversalOf,
    lines: linesFor(state, lines),
    createdAt: new Date(now).toISOString(),
  };
  state.journals.push(row);
  return row;
}
function outstanding(document: Document) {
  return document.voided
    ? 0
    : document.amountSen - document.settledSen - document.creditedSen;
}
function notBefore(value: string, minimum: string) {
  if (value < minimum)
    fail("The posting date cannot precede its source transaction.");
}
function cash(journal: Journal) {
  return journal.lines
    .filter((line) => line.accountId === "bank")
    .reduce((sum, line) => sum + line.debitSen - line.creditSen, 0);
}

function apply(state: AccountingState, action: Action, now: number) {
  const a = action.args;
  switch (action.type) {
    case "transaction.post": {
      fields(a, ["kind", "date", "memo", "partyId", "dueDate", "amountSen"]);
      if (!["Income", "Expense", "Invoice", "Bill"].includes(a.kind as string))
        throw new LabsError(400, "Choose a valid transaction kind.");
      const kind = a.kind as "Income" | "Expense" | "Invoice" | "Bill",
        postingDate = date(a.date),
        memo = text(a.memo, "Memo"),
        amount = money(a.amountSen);
      if (kind === "Income" || kind === "Expense") {
        if (a.partyId !== null || a.dueDate !== null)
          throw new LabsError(
            400,
            "Cash transactions take no party or due date.",
          );
        post(
          state,
          kind,
          postingDate,
          memo,
          kind === "Income"
            ? [debit("bank", amount), credit("sales", amount)]
            : [debit("expense", amount), credit("bank", amount)],
          now,
          null,
          amount,
        );
      } else {
        room(state.documents, accountingLimits.documents);
        const party = find(state.parties, a.partyId, "Party"),
          dueDate = date(a.dueDate);
        if (party.kind !== (kind === "Invoice" ? "Customer" : "Supplier"))
          fail("Choose the correct customer or supplier.");
        notBefore(dueDate, postingDate);
        const id = randomUUID();
        const journal = post(
          state,
          kind,
          postingDate,
          memo,
          kind === "Invoice"
            ? [debit("receivable", amount), credit("sales", amount)]
            : [debit("expense", amount), credit("payable", amount)],
          now,
          id,
          amount,
        );
        state.documents.push({
          id,
          version: 1,
          reference: `${kind === "Invoice" ? "INV" : "BILL"}-${String(state.documents.length + 1).padStart(4, "0")}`,
          kind,
          partyId: party.id,
          date: postingDate,
          dueDate,
          amountSen: amount,
          settledSen: 0,
          creditedSen: 0,
          voided: false,
          journalId: journal.id,
        });
      }
      return `${kind} posted with balanced journal lines.`;
    }
    case "journal.post":
    case "opening.post": {
      fields(a, ["date", "memo", "lines"]);
      const opening = action.type === "opening.post",
        lines = linesFor(state, a.lines, true);
      if (opening && state.journals.length)
        fail("Opening balances must be the first and only opening posting.");
      if (
        opening &&
        lines.some((line) =>
          ["Income", "Expense"].includes(
            find(state.accounts, line.accountId, "Account").category,
          ),
        )
      )
        fail("Opening balances use balance-sheet accounts only.");
      post(
        state,
        opening ? "Opening" : "Adjustment",
        date(a.date),
        text(a.memo, "Memo"),
        lines,
        now,
      );
      return opening
        ? "Opening balances posted."
        : "Balanced adjustment posted.";
    }
    case "document.settle":
    case "document.credit": {
      const isCredit = action.type === "document.credit";
      fields(
        a,
        isCredit
          ? ["id", "version", "date", "amountSen", "memo"]
          : ["id", "version", "date", "amountSen"],
      );
      const document = versioned(state.documents, a, "Document"),
        amount = money(a.amountSen),
        postingDate = date(a.date);
      if (document.voided || amount > outstanding(document))
        fail("Amount exceeds this document's unpaid outstanding balance.");
      notBefore(postingDate, document.date);
      const invoice = document.kind === "Invoice";
      const lines = isCredit
        ? invoice
          ? [debit("sales", amount), credit("receivable", amount)]
          : [debit("payable", amount), credit("expense", amount)]
        : invoice
          ? [debit("bank", amount), credit("receivable", amount)]
          : [debit("payable", amount), credit("bank", amount)];
      post(
        state,
        isCredit ? "Credit" : invoice ? "Receipt" : "Payment",
        postingDate,
        isCredit
          ? text(a.memo, "Credit memo")
          : `Partial or full settlement of ${document.reference}.`,
        lines,
        now,
        document.id,
        amount,
      );
      if (isCredit) document.creditedSen += amount;
      else document.settledSen += amount;
      document.version++;
      return `${isCredit ? "Credit note" : "Settlement"} posted for ${document.reference}.`;
    }
    case "journal.reverse": {
      fields(a, ["id", "date", "memo"]);
      const original = find(state.journals, a.id, "Journal"),
        postingDate = date(a.date);
      if (
        original.kind === "Reversal" ||
        state.journals.some((row) => row.reversalOf === original.id)
      )
        fail("This journal cannot be reversed again.");
      if (original.kind.startsWith("Inventory"))
        fail(
          "Inventory journals require a stock compensation workflow and cannot be reversed directly.",
        );
      if (
        state.bankTransactions.some(
          (row) => row.matchedJournalId === original.id,
        )
      )
        fail("Unmatch the bank transaction before reversing this posting.");
      notBefore(postingDate, original.date);
      if (original.sourceId) {
        const document = find(state.documents, original.sourceId, "Document");
        if (original.kind === "Invoice" || original.kind === "Bill") {
          if (document.settledSen || document.creditedSen)
            fail(
              "Reverse settlements and credit notes before reversing the source document.",
            );
          const latest = state.journals
            .filter((journal) => journal.sourceId === document.id)
            .map((journal) => journal.date)
            .sort()
            .at(-1);
          if (latest) notBefore(postingDate, latest);
          document.voided = true;
        } else if (original.kind === "Credit")
          document.creditedSen -= original.amountSen;
        else if (original.kind === "Receipt" || original.kind === "Payment")
          document.settledSen -= original.amountSen;
        document.version++;
      }
      post(
        state,
        "Reversal",
        postingDate,
        text(a.memo, "Reversal memo"),
        original.lines.map((line) => ({
          accountId: line.accountId,
          debitSen: line.creditSen,
          creditSen: line.debitSen,
        })),
        now,
        original.sourceId,
        original.amountSen,
        original.id,
      );
      return `Reversal posted for ${original.reference}; original entry retained unchanged.`;
    }
    case "period.create": {
      fields(a, ["name", "start", "end"]);
      room(state.periods, accountingLimits.periods);
      const start = date(a.start),
        end = date(a.end);
      if (start > end || Date.parse(end) - Date.parse(start) > 366 * 86400000)
        throw new LabsError(400, "Choose a period no longer than one year.");
      if (
        state.periods.some(
          (period) => start <= period.end && period.start <= end,
        )
      )
        fail("Accounting periods cannot overlap.");
      state.periods.push({
        id: randomUUID(),
        version: 1,
        name: text(a.name, "Period name", 60),
        start,
        end,
        closed: false,
      });
      return "Accounting period created.";
    }
    case "period.close": {
      fields(a, ["id", "version"]);
      const period = versioned(state.periods, a, "Period");
      if (period.closed) fail("This accounting period is already closed.");
      if (
        state.bankTransactions.some(
          (row) =>
            row.date >= period.start &&
            row.date <= period.end &&
            !row.matchedJournalId,
        )
      )
        fail(
          "Match outstanding bank statement lines before closing this period.",
        );
      period.closed = true;
      period.version++;
      return "Period closed. Later postings and backdated reversals in this period are blocked.";
    }
    case "account.create": {
      fields(a, ["code", "name", "category"]);
      room(state.accounts, accountingLimits.accounts);
      const code = text(a.code, "Account code", 4),
        category = a.category as Category;
      if (
        !/^\d{4}$/.test(code) ||
        !["Asset", "Liability", "Equity", "Income", "Expense"].includes(
          category,
        )
      )
        throw new LabsError(
          400,
          "Use a unique four-digit account code and category.",
        );
      if (state.accounts.some((row) => row.code === code))
        fail("Account code is already in use.");
      state.accounts.push({
        id: randomUUID(),
        code,
        name: text(a.name, "Account name", 80),
        category,
      });
      return "Account added to the chart.";
    }
    case "party.create": {
      fields(a, ["name", "kind"]);
      room(state.parties, accountingLimits.parties);
      if (a.kind !== "Customer" && a.kind !== "Supplier")
        throw new LabsError(400, "Choose Customer or Supplier.");
      state.parties.push({
        id: randomUUID(),
        name: text(a.name, "Fictional business name", 80),
        kind: a.kind,
      });
      return "Fictional business record created.";
    }
    case "bank.match":
    case "bank.unmatch": {
      const matching = action.type === "bank.match";
      fields(a, matching ? ["id", "version", "journalId"] : ["id", "version"]);
      const bank = versioned(state.bankTransactions, a, "Bank transaction");
      periodFor(state, bank.date);
      if (matching) {
        if (bank.matchedJournalId) fail("Unmatch the existing journal first.");
        const journal = find(state.journals, a.journalId, "Journal");
        if (
          state.bankTransactions.some(
            (row) => row.matchedJournalId === journal.id,
          )
        )
          fail("This journal is already matched to another bank line.");
        if (state.journals.some((row) => row.reversalOf === journal.id))
          fail("A reversed original journal cannot be matched.");
        if (cash(journal) !== bank.amountSen)
          fail("Bank matching requires the exact signed bank amount.");
        bank.matchedJournalId = journal.id;
      } else {
        if (!bank.matchedJournalId)
          fail("This bank transaction is not matched.");
        bank.matchedJournalId = null;
      }
      bank.version++;
      return matching
        ? "Bank line matched without creating a journal."
        : "Bank line unmatched; posted journals unchanged.";
    }
    case "inventory.purchase":
    case "inventory.sell": {
      const buying = action.type === "inventory.purchase";
      fields(
        a,
        buying
          ? ["id", "version", "date", "quantity", "unitCostSen"]
          : ["id", "version", "date", "quantity", "unitPriceSen"],
      );
      const item = versioned(state.inventory, a, "Inventory item"),
        quantity = integer(
          a.quantity,
          "Quantity",
          1,
          accountingLimits.quantity,
        ),
        price = money(buying ? a.unitCostSen : a.unitPriceSen),
        postingDate = date(a.date);
      const previous = state.journals
        .filter(
          (row) => row.kind.startsWith("Inventory") && row.sourceId === item.id,
        )
        .map((row) => row.date)
        .sort()
        .at(-1);
      if (previous) notBefore(postingDate, previous);
      const amount = quantity * price;
      if (!Number.isSafeInteger(amount) || amount > accountingLimits.money)
        throw new LabsError(
          400,
          "Inventory transaction exceeds its money bound.",
        );
      if (buying) {
        if (
          item.quantity + quantity > accountingLimits.quantity ||
          item.valueSen + amount > accountingLimits.money
        )
          fail("Inventory capacity would be exceeded.");
        post(
          state,
          "Inventory purchase",
          postingDate,
          `Cash inventory purchase: ${item.name}.`,
          [debit("inventory", amount), credit("bank", amount)],
          now,
          item.id,
          amount,
        );
        item.quantity += quantity;
        item.valueSen += amount;
      } else {
        if (quantity > item.quantity)
          fail("Insufficient inventory; no sale was posted.");
        const numerator = BigInt(item.valueSen) * BigInt(quantity),
          divisor = BigInt(item.quantity);
        const cost = Number((numerator * 2n + divisor) / (divisor * 2n));
        const lines = [debit("bank", amount), credit("sales", amount)];
        if (cost > 0)
          lines.push(debit("cogs", cost), credit("inventory", cost));
        post(
          state,
          "Inventory sale",
          postingDate,
          `Cash inventory sale: ${item.name}; moving weighted-average COGS.`,
          lines,
          now,
          item.id,
          amount,
        );
        item.quantity -= quantity;
        item.valueSen -= cost;
      }
      item.version++;
      return buying
        ? "Inventory and bank purchase posted."
        : "Inventory sale, revenue and weighted-average COGS posted.";
    }
    default:
      throw new LabsError(400, "Unknown accounting action.");
  }
}

export function seedAccounting(now: number): AccountingState {
  const today = new Date(now + 8 * 3600000).toISOString().slice(0, 10),
    year = Number(today.slice(0, 4));
  const day = (offset: number) =>
    new Date(Date.parse(today) + offset * 86400000).toISOString().slice(0, 10);
  const state: AccountingState = {
    today,
    accounts: [
      { id: "bank", code: "1000", name: "Demo Bank", category: "Asset" },
      {
        id: "receivable",
        code: "1100",
        name: "Accounts receivable",
        category: "Asset",
      },
      { id: "inventory", code: "1200", name: "Inventory", category: "Asset" },
      {
        id: "payable",
        code: "2000",
        name: "Accounts payable",
        category: "Liability",
      },
      {
        id: "capital",
        code: "3000",
        name: "Owner capital",
        category: "Equity",
      },
      { id: "sales", code: "4000", name: "Sales income", category: "Income" },
      {
        id: "cogs",
        code: "5000",
        name: "Cost of goods sold",
        category: "Expense",
      },
      {
        id: "expense",
        code: "5100",
        name: "Operating expenses",
        category: "Expense",
      },
    ],
    periods: [
      {
        id: "prior-year",
        version: 1,
        name: String(year - 1),
        start: `${year - 1}-01-01`,
        end: `${year - 1}-12-31`,
        closed: false,
      },
      {
        id: "current-year",
        version: 1,
        name: String(year),
        start: `${year}-01-01`,
        end: `${year}-12-31`,
        closed: false,
      },
    ],
    parties: [
      {
        id: "customer-1",
        name: "Fictional Bunga Studio Sdn Bhd",
        kind: "Customer",
      },
      {
        id: "supplier-1",
        name: "Fictional Meranti Supplies",
        kind: "Supplier",
      },
    ],
    journals: [],
    documents: [],
    bankTransactions: [],
    inventory: [
      {
        id: "chair",
        version: 1,
        name: "Demo studio chair",
        quantity: 0,
        valueSen: 0,
      },
    ],
    history: [],
  };
  let n = 0;
  const act = (type: string, args: Record<string, unknown>) =>
    apply(
      state,
      { type, args, requestId: "seed", csrf: "seed", generation: 1 },
      now,
    );
  act("opening.post", {
    date: day(-60),
    memo: "Fictional opening bank and capital balances.",
    lines: [debit("bank", 1000000), credit("capital", 1000000)],
  });
  act("transaction.post", {
    kind: "Invoice",
    date: day(-40),
    memo: "Fictional studio services invoice.",
    partyId: "customer-1",
    dueDate: day(-10),
    amountSen: 200000,
  });
  act("transaction.post", {
    kind: "Bill",
    date: day(-30),
    memo: "Fictional supplies bill.",
    partyId: "supplier-1",
    dueDate: day(5),
    amountSen: 80000,
  });
  const invoice = state.documents[0],
    bill = state.documents[1];
  act("document.settle", {
    id: invoice.id,
    version: invoice.version,
    date: day(-5),
    amountSen: 75000,
  });
  act("document.settle", {
    id: bill.id,
    version: bill.version,
    date: day(-4),
    amountSen: 30000,
  });
  act("transaction.post", {
    kind: "Expense",
    date: day(-2),
    memo: "Fictional studio utility expense.",
    partyId: null,
    dueDate: null,
    amountSen: 20000,
  });
  act("inventory.purchase", {
    id: "chair",
    version: state.inventory[0].version,
    date: day(-20),
    quantity: 3,
    unitCostSen: 10001,
  });
  act("inventory.sell", {
    id: "chair",
    version: state.inventory[0].version,
    date: day(-1),
    quantity: 1,
    unitPriceSen: 20000,
  });
  // Stable fixture IDs do not depend on entropy; ordinary mutations still use UUIDs.
  const ids = new Map<string, string>();
  for (const journal of state.journals) ids.set(journal.id, `journal-${++n}`);
  state.documents.forEach((document, index) => {
    ids.set(document.id, `document-${index + 1}`);
  });
  for (const document of state.documents) {
    document.id = ids.get(document.id)!;
    document.journalId = ids.get(document.journalId)!;
  }
  for (const journal of state.journals) {
    journal.id = ids.get(journal.id)!;
    journal.sourceId = ids.get(journal.sourceId ?? "") ?? journal.sourceId;
  }
  state.bankTransactions = state.journals
    .filter((journal) => cash(journal) !== 0)
    .map((journal, index) => ({
      id: `bank-${index + 1}`,
      version: 1,
      date: journal.date,
      description: `Fictional bank statement: ${journal.memo}`,
      amountSen: cash(journal),
      matchedJournalId: index === 0 ? journal.id : null,
    }));
  return state;
}

export function createAccountingModule(
  clock: () => number = Date.now,
): ProductModule<AccountingState> {
  return {
    id: "accounting-cloud",
    seed: () => seedAccounting(clock()),
    reduce(state, action, actor) {
      assertRole(actor.role, ["manager"]);
      const next = structuredClone(state),
        now = clock();
      next.today = new Date(now + 8 * 3600000).toISOString().slice(0, 10);
      const detail = apply(next, action, now);
      next.history.unshift({
        id: randomUUID(),
        at: new Date(now).toISOString(),
        event: action.type,
        detail,
      });
      next.history = next.history.slice(0, accountingLimits.history);
      if (
        Buffer.byteLength(JSON.stringify(next), "utf8") >
        accountingLimits.stateBytes
      )
        throw new LabsError(
          429,
          "Workspace size limit reached. Reset the demo to start again.",
        );
      return next;
    },
    project(state, actor): AccountingView {
      const manager = actor.role === "manager",
        now = clock(),
        today = new Date(now + 8 * 3600000).toISOString().slice(0, 10),
        snapshot = { ...state, today };
      const reports = accountingReports(snapshot);
      if (!manager) {
        reports.aging = [];
        reports.ledger = [];
        reports.trial = [];
      }
      return {
        ...structuredClone(snapshot),
        today,
        accounts: manager ? structuredClone(state.accounts) : [],
        periods: manager ? structuredClone(state.periods) : [],
        parties: manager ? structuredClone(state.parties) : [],
        journals: manager ? structuredClone(state.journals) : [],
        documents: manager ? structuredClone(state.documents) : [],
        bankTransactions: manager
          ? structuredClone(state.bankTransactions)
          : [],
        inventory: manager ? structuredClone(state.inventory) : [],
        history: manager ? structuredClone(state.history) : [],
        reports,
        asOf: new Date(now).toISOString(),
        canManage: manager,
      };
    },
  };
}
export const accountingModule = createAccountingModule();
