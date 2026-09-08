import assert from "node:assert/strict";
import test from "node:test";
import {
  createAccountingModule,
  accountingReports,
  accountingLimits,
} from "../../packages/accounting/index.ts";

const now = Date.parse("2026-11-23T04:00:00.000Z");
const module = createAccountingModule(() => now);
const actor = { role: "manager", customerId: "fictional" };
const act = (state, type, args, role = "manager") =>
  module.reduce(
    state,
    { type, args, requestId: "test", csrf: "test", generation: 1 },
    { ...actor, role },
  );
const bad = (status) => (error) => error.status === status;
const ref = (row) => ({ id: row.id, version: row.version });
const sum = (lines) =>
  lines.reduce((n, line) => n + line.debitSen - line.creditSen, 0);
const current = (state) => accountingReports(state);
const tx = (kind, amountSen = 10000, extra = {}) => ({
  kind,
  date: "2026-11-23",
  memo: "Fictional transaction.",
  partyId: null,
  dueDate: null,
  amountSen,
  ...extra,
});
const debit = (accountId, debitSen) => ({ accountId, debitSen, creditSen: 0 });
const credit = (accountId, creditSen) => ({
  accountId,
  debitSen: 0,
  creditSen,
});

test("seed is deterministic and reconciles the complete numeric accounting fixture", () => {
  const state = module.seed();
  assert.deepEqual(module.seed(), state);
  assert.equal(state.journals.length, 8);
  assert.equal(state.documents.length, 2);
  for (const journal of state.journals) assert.equal(sum(journal.lines), 0);
  const r = current(state);
  assert.equal(r.cashSen, 1014997);
  assert.equal(r.receivableSen, 125000);
  assert.equal(r.payableSen, 50000);
  assert.equal(r.inventoryValueSen, 20002);
  assert.equal(r.incomeSen, 220000);
  assert.equal(r.expenseSen, 110001);
  assert.equal(r.profitSen, 109999);
  assert.equal(r.assetsSen, 1159999);
  assert.equal(r.liabilitiesSen, 50000);
  assert.equal(r.equitySen, 1109999);
  assert.equal(r.balanceDifferenceSen, 0);
  assert.equal(r.totalDebitSen, r.totalCreditSen);
  assert.equal(r.bankStatementSen, r.cashSen);
  assert.equal(r.aging.find((row) => row.kind === "Invoice").bucket, "1–30");
  assert.equal(r.aging.find((row) => row.kind === "Bill").bucket, "Current");
  assert.equal(state.inventory[0].quantity, 2);
  assert.equal(state.inventory[0].valueSen, 20002);
});

test("viewer and customer see aggregates while manager owns all mutations and internal records", () => {
  const state = module.seed();
  for (const role of ["customer", "viewer", "cashier", "kitchen"]) {
    const view = module.project(state, { ...actor, role });
    for (const key of [
      "accounts",
      "periods",
      "parties",
      "journals",
      "documents",
      "bankTransactions",
      "inventory",
      "history",
    ])
      assert.deepEqual(view[key], [], key);
    assert.deepEqual(view.reports.aging, []);
    assert.deepEqual(view.reports.ledger, []);
    assert.deepEqual(view.reports.trial, []);
    assert.equal(view.reports.profitSen, 109999);
    assert.equal(view.canManage, false);
    for (const type of [
      "transaction.post",
      "journal.post",
      "document.settle",
      "journal.reverse",
      "period.close",
      "bank.match",
      "inventory.sell",
    ])
      assert.throws(() => act(state, type, {}, role), bad(403));
  }
  const view = module.project(state, actor);
  assert.equal(view.canManage, true);
  view.journals[0].memo = "tampered";
  assert.notEqual(state.journals[0].memo, "tampered");
});

test("income and expense are balanced cash postings and rejected actions leave the source immutable", () => {
  const state = module.seed(),
    before = structuredClone(state);
  const income = act(state, "transaction.post", tx("Income", 12345));
  const expense = act(income, "transaction.post", tx("Expense", 2345));
  assert.equal(current(expense).cashSen, current(state).cashSen + 10000);
  assert.equal(current(expense).profitSen, current(state).profitSen + 10000);
  assert.deepEqual(state, before);
  for (const amount of [0, -1, 0.5, Number.MAX_SAFE_INTEGER, NaN])
    assert.throws(
      () => act(state, "transaction.post", tx("Income", amount)),
      bad(400),
    );
  assert.throws(
    () =>
      act(state, "transaction.post", {
        ...tx("Income"),
        workspaceId: "forged",
      }),
    bad(400),
  );
  assert.throws(
    () =>
      act(
        state,
        "transaction.post",
        tx("Income", 100, { partyId: "customer-1" }),
      ),
    bad(400),
  );
  assert.deepEqual(state, before);
});

test("invoices and bills create balanced documents with correct party and calendar validation", () => {
  const seed = module.seed();
  const invoice = act(
    seed,
    "transaction.post",
    tx("Invoice", 50000, { partyId: "customer-1", dueDate: "2026-12-23" }),
  );
  const bill = act(
    invoice,
    "transaction.post",
    tx("Bill", 10000, { partyId: "supplier-1", dueDate: "2026-12-01" }),
  );
  assert.equal(current(bill).receivableSen, 175000);
  assert.equal(current(bill).payableSen, 60000);
  assert.equal(current(bill).cashSen, current(seed).cashSen);
  assert.equal(current(bill).balanceDifferenceSen, 0);
  assert.throws(
    () =>
      act(
        seed,
        "transaction.post",
        tx("Invoice", 100, { partyId: "supplier-1", dueDate: "2026-12-01" }),
      ),
    bad(409),
  );
  assert.throws(
    () =>
      act(
        seed,
        "transaction.post",
        tx("Bill", 100, { partyId: "foreign-party", dueDate: "2026-12-01" }),
      ),
    bad(404),
  );
  assert.throws(
    () =>
      act(
        seed,
        "transaction.post",
        tx("Invoice", 100, {
          partyId: "customer-1",
          date: "2026-02-30",
          dueDate: "2026-12-01",
        }),
      ),
    bad(400),
  );
  assert.throws(
    () =>
      act(
        seed,
        "transaction.post",
        tx("Invoice", 100, { partyId: "customer-1", dueDate: "2026-11-22" }),
      ),
    bad(409),
  );
});

test("partial receipts and supplier payments reduce control balances without recognizing income twice", () => {
  const state = module.seed(),
    before = current(state);
  let next = act(state, "document.settle", {
    ...ref(state.documents[0]),
    date: state.today,
    amountSen: 25000,
  });
  next = act(next, "document.settle", {
    ...ref(next.documents[1]),
    date: state.today,
    amountSen: 10000,
  });
  const result = current(next);
  assert.equal(result.receivableSen, before.receivableSen - 25000);
  assert.equal(result.payableSen, before.payableSen - 10000);
  assert.equal(result.cashSen, before.cashSen + 15000);
  assert.equal(result.profitSen, before.profitSen);
  assert.equal(next.documents[0].settledSen, 100000);
  assert.throws(
    () =>
      act(next, "document.settle", {
        ...ref(state.documents[0]),
        date: state.today,
        amountSen: 1,
      }),
    bad(409),
  );
  assert.throws(
    () =>
      act(next, "document.settle", {
        ...ref(next.documents[0]),
        date: state.today,
        amountSen: 100001,
      }),
    bad(409),
  );
});

test("credit notes reduce only unpaid outstanding amounts and preserve cash", () => {
  const state = module.seed();
  let next = act(state, "document.credit", {
    ...ref(state.documents[0]),
    date: state.today,
    amountSen: 10000,
    memo: "Fictional invoice allowance.",
  });
  next = act(next, "document.credit", {
    ...ref(next.documents[1]),
    date: state.today,
    amountSen: 5000,
    memo: "Fictional supplier allowance.",
  });
  const before = current(state),
    after = current(next);
  assert.equal(after.receivableSen, before.receivableSen - 10000);
  assert.equal(after.payableSen, before.payableSen - 5000);
  assert.equal(after.cashSen, before.cashSen);
  assert.equal(after.profitSen, before.profitSen - 5000);
  assert.equal(after.balanceDifferenceSen, 0);
  assert.throws(
    () =>
      act(next, "document.credit", {
        ...ref(next.documents[0]),
        date: state.today,
        amountSen: 115001,
        memo: "Too much.",
      }),
    bad(409),
  );
});

test("manual adjustments balance exactly and cannot bypass AR AP or inventory subledgers", () => {
  const state = module.seed();
  const adjustment = act(state, "journal.post", {
    date: state.today,
    memo: "Fictional noncash capital adjustment.",
    lines: [debit("expense", 99), credit("capital", 99)],
  });
  assert.equal(current(adjustment).profitSen, current(state).profitSen - 99);
  assert.equal(current(adjustment).balanceDifferenceSen, 0);
  for (const lines of [
    [debit("expense", 100), credit("bank", 99)],
    [debit("receivable", 100), credit("sales", 100)],
    [debit("inventory", 100), credit("bank", 100)],
    [
      { accountId: "bank", debitSen: 100, creditSen: 100 },
      credit("sales", 100),
    ],
    [debit("foreign", 100), credit("bank", 100)],
  ])
    assert.throws(() =>
      act(state, "journal.post", {
        date: state.today,
        memo: "Invalid adjustment.",
        lines,
      }),
    );
  assert.throws(
    () =>
      act(state, "opening.post", {
        date: state.today,
        memo: "Duplicate opening.",
        lines: [debit("bank", 100), credit("capital", 100)],
      }),
    bad(409),
  );
});

test("posted journals remain immutable and controlled reversals restore balances exactly once", () => {
  const state = act(module.seed(), "transaction.post", tx("Income", 1234));
  const original = structuredClone(state.journals.at(-1));
  const reversed = act(state, "journal.reverse", {
    id: original.id,
    date: state.today,
    memo: "Correct fictional duplicate income.",
  });
  assert.deepEqual(
    reversed.journals.find((row) => row.id === original.id),
    original,
  );
  assert.equal(reversed.journals.at(-1).reversalOf, original.id);
  assert.equal(current(reversed).profitSen, 109999);
  assert.throws(
    () =>
      act(reversed, "journal.reverse", {
        id: original.id,
        date: state.today,
        memo: "Again.",
      }),
    bad(409),
  );
  assert.throws(
    () =>
      act(reversed, "journal.reverse", {
        id: reversed.journals.at(-1).id,
        date: state.today,
        memo: "Reverse reversal.",
      }),
    bad(409),
  );
});

test("document reversal requires reversing settlements first and reconstructs historical aging", () => {
  const seed = module.seed();
  assert.throws(
    () =>
      act(seed, "journal.reverse", {
        id: "journal-2",
        date: seed.today,
        memo: "Reverse paid invoice.",
      }),
    bad(409),
  );
  let next = act(seed, "journal.reverse", {
    id: "journal-4",
    date: seed.today,
    memo: "Undo receipt.",
  });
  assert.equal(next.documents[0].settledSen, 0);
  assert.equal(current(next).receivableSen, 200000);
  next = act(next, "journal.reverse", {
    id: "journal-2",
    date: seed.today,
    memo: "Undo original invoice.",
  });
  assert.equal(next.documents[0].voided, true);
  assert.equal(current(next).receivableSen, 0);
  assert.equal(
    accountingReports(next, "2026-01-01", "2026-11-22").receivableSen,
    125000,
  );
  assert.equal(
    accountingReports(next, "2026-01-01", "2026-11-22").aging.find(
      (row) => row.kind === "Invoice",
    ).outstandingSen,
    125000,
  );
});

test("dated reports derive period P&L and inception balance sheet from posted journals", () => {
  const state = module.seed();
  const date = "2026-11-23";
  const next = act(state, "transaction.post", tx("Income", 777));
  const r = accountingReports(next, date, date);
  assert.equal(r.incomeSen, 777);
  assert.equal(r.expenseSen, 0);
  assert.equal(r.profitSen, 777);
  assert.equal(r.cashSen, current(state).cashSen + 777);
  assert.equal(r.balanceDifferenceSen, 0);
  assert.equal(r.ledger.length, 2);
  assert.equal(r.totalDebitSen, r.totalCreditSen);
  assert.equal(
    r.totalDebitSen,
    r.trial.reduce((sum, row) => sum + row.debitSen, 0),
  );
  assert.equal(
    r.trial.find((row) => row.id === "bank").debitSen,
    current(state).cashSen + 777,
  );
  assert.equal(r.trial.find((row) => row.id === "sales").creditSen, 220777);
  assert.throws(() => accountingReports(state, "2026-12-01", "2026-11-01"));
  assert.throws(() => accountingReports(state, "2026-02-30", date));
});

test("weighted-average stock cost rounds half up and full liquidation consumes residual value", () => {
  const initial = module.seed();
  initial.inventory[0].quantity = 0;
  initial.inventory[0].valueSen = 0;
  // A new empty-stock fixture keeps prior posted history out of the comparison.
  initial.journals = [];
  initial.documents = [];
  initial.bankTransactions = [];
  let next = act(initial, "inventory.purchase", {
    id: "chair",
    version: initial.inventory[0].version,
    date: initial.today,
    quantity: 1,
    unitCostSen: 100,
  });
  next = act(next, "inventory.purchase", {
    ...ref(next.inventory[0]),
    date: next.today,
    quantity: 1,
    unitCostSen: 101,
  });
  next = act(next, "inventory.sell", {
    ...ref(next.inventory[0]),
    date: next.today,
    quantity: 1,
    unitPriceSen: 200,
  });
  assert.equal(next.inventory[0].quantity, 1);
  assert.equal(next.inventory[0].valueSen, 100);
  assert.equal(
    next.journals.at(-1).lines.find((line) => line.accountId === "cogs")
      .debitSen,
    101,
  );
  next = act(next, "inventory.sell", {
    ...ref(next.inventory[0]),
    date: next.today,
    quantity: 1,
    unitPriceSen: 200,
  });
  assert.equal(next.inventory[0].quantity, 0);
  assert.equal(next.inventory[0].valueSen, 0);
  assert.equal(current(next).inventoryValueSen, 0);
  assert.equal(current(next).profitSen, 199);
  assert.equal(current(next).balanceDifferenceSen, 0);
});

test("stock rejects oversell, stale versions, backdating and unsafe amounts atomically", () => {
  const state = module.seed(),
    before = structuredClone(state);
  assert.throws(
    () =>
      act(state, "inventory.sell", {
        ...ref(state.inventory[0]),
        date: state.today,
        quantity: 3,
        unitPriceSen: 20000,
      }),
    bad(409),
  );
  assert.throws(
    () =>
      act(state, "inventory.sell", {
        id: "chair",
        version: 1,
        date: state.today,
        quantity: 1,
        unitPriceSen: 20000,
      }),
    bad(409),
  );
  assert.throws(
    () =>
      act(state, "inventory.purchase", {
        ...ref(state.inventory[0]),
        date: "2026-11-01",
        quantity: 1,
        unitCostSen: 100,
      }),
    bad(409),
  );
  assert.throws(
    () =>
      act(state, "inventory.purchase", {
        ...ref(state.inventory[0]),
        date: state.today,
        quantity: 10000,
        unitCostSen: 100000000,
      }),
    bad(400),
  );
  assert.throws(
    () =>
      act(state, "journal.reverse", {
        id: "journal-8",
        date: state.today,
        memo: "Cannot erase COGS.",
      }),
    bad(409),
  );
  assert.deepEqual(state, before);
});

test("bank matching is exact one-to-one and never creates or rewrites journals", () => {
  const state = module.seed();
  const row = state.bankTransactions.find((row) => row.amountSen === 75000);
  const matched = act(state, "bank.match", {
    ...ref(row),
    journalId: "journal-4",
  });
  assert.deepEqual(matched.journals, state.journals);
  assert.equal(
    current(matched).unmatchedBankSen,
    current(state).unmatchedBankSen - 75000,
  );
  assert.throws(
    () => act(state, "bank.match", { ...ref(row), journalId: "journal-5" }),
    bad(409),
  );
  assert.throws(
    () =>
      act(matched, "journal.reverse", {
        id: "journal-4",
        date: state.today,
        memo: "Blocked match.",
      }),
    bad(409),
  );
  const unmatched = act(
    matched,
    "bank.unmatch",
    ref(matched.bankTransactions.find((item) => item.id === row.id)),
  );
  assert.deepEqual(unmatched.journals, state.journals);
  const reversed = act(unmatched, "journal.reverse", {
    id: "journal-4",
    date: state.today,
    memo: "Correct unmatched receipt.",
  });
  assert.throws(
    () =>
      act(reversed, "bank.match", {
        ...ref(reversed.bankTransactions.find((item) => item.id === row.id)),
        journalId: "journal-4",
      }),
    bad(409),
  );
});

test("periods cannot overlap and closed periods reject backdated transactions and reversals", () => {
  let state = module.seed();
  assert.throws(
    () =>
      act(state, "period.create", {
        name: "Overlap",
        start: "2026-06-01",
        end: "2026-07-01",
      }),
    bad(409),
  );
  assert.throws(
    () => act(state, "period.close", ref(state.periods[1])),
    bad(409),
  );
  for (const bank of state.bankTransactions.filter(
    (row) => !row.matchedJournalId,
  )) {
    const journal = state.journals.find(
      (journal) =>
        journal.lines
          .filter((line) => line.accountId === "bank")
          .reduce((sum, line) => sum + line.debitSen - line.creditSen, 0) ===
        bank.amountSen,
    );
    state = act(state, "bank.match", { ...ref(bank), journalId: journal.id });
  }
  const closed = act(state, "period.close", ref(state.periods[1]));
  assert.equal(closed.periods[1].closed, true);
  assert.throws(() => act(closed, "transaction.post", tx("Income")), bad(409));
  assert.throws(
    () =>
      act(closed, "journal.reverse", {
        id: "journal-6",
        date: closed.today,
        memo: "Closed period.",
      }),
    bad(409),
  );
  assert.throws(
    () => act(closed, "bank.unmatch", ref(closed.bankTransactions[1])),
    bad(409),
  );
  const extended = act(closed, "period.create", {
    name: "2027",
    start: "2027-01-01",
    end: "2027-12-31",
  });
  assert.equal(extended.periods.length, 3);
});

test("chart and party creation validates category/code, identity and record bounds", () => {
  const state = module.seed();
  const account = act(state, "account.create", {
    code: "1300",
    name: "Fictional prepaid rent",
    category: "Asset",
  });
  assert.equal(account.accounts.length, 9);
  assert.throws(
    () =>
      act(account, "account.create", {
        code: "1300",
        name: "Duplicate",
        category: "Asset",
      }),
    bad(409),
  );
  assert.throws(
    () =>
      act(state, "account.create", {
        code: "BANK",
        name: "Invalid",
        category: "Asset",
      }),
    bad(400),
  );
  const party = act(state, "party.create", {
    name: "Fictional Anggerik Studio",
    kind: "Customer",
  });
  assert.equal(party.parties.length, 3);
  assert.throws(
    () => act(state, "party.create", { name: "Fake", kind: "Administrator" }),
    bad(400),
  );
  state.parties = Array.from({ length: accountingLimits.parties }, (_, i) => ({
    id: `p-${i}`,
    name: "Fictional",
    kind: "Customer",
  }));
  assert.throws(
    () => act(state, "party.create", { name: "Full", kind: "Customer" }),
    bad(429),
  );
});

test("future settlements and their reversal chronology cannot create negative historical receivables", () => {
  const state = module.seed();
  const later = act(state, "document.settle", {
    ...ref(state.documents[0]),
    date: "2026-11-25",
    amountSen: 125000,
  });
  assert.equal(
    accountingReports(later, "2026-01-01", "2026-11-23").receivableSen,
    125000,
  );
  const futureReceipt = later.journals.at(-1);
  assert.throws(
    () =>
      act(later, "journal.reverse", {
        id: futureReceipt.id,
        date: "2026-11-24",
        memo: "Too early.",
      }),
    bad(409),
  );
  let reversed = act(later, "journal.reverse", {
    id: futureReceipt.id,
    date: "2026-11-26",
    memo: "Undo future receipt.",
  });
  reversed = act(reversed, "journal.reverse", {
    id: "journal-4",
    date: "2026-11-27",
    memo: "Undo original receipt.",
  });
  assert.throws(
    () =>
      act(reversed, "journal.reverse", {
        id: "journal-2",
        date: "2026-11-25",
        memo: "Would create historical negative control.",
      }),
    bad(409),
  );
  reversed = act(reversed, "journal.reverse", {
    id: "journal-2",
    date: "2026-11-27",
    memo: "Reverse after all source effects.",
  });
  for (const day of [
    "2026-11-23",
    "2026-11-24",
    "2026-11-25",
    "2026-11-26",
    "2026-11-27",
  ])
    assert.ok(
      accountingReports(reversed, "2026-01-01", day).receivableSen >= 0,
    );
});

test("bank lines cannot claim the same journal twice and empty closed periods still reject postings", () => {
  const state = module.seed();
  const source = state.bankTransactions.find((row) => row.amountSen === 75000);
  state.bankTransactions.push({ ...source, id: "duplicate-statement-line" });
  const matched = act(state, "bank.match", {
    ...ref(source),
    journalId: "journal-4",
  });
  assert.throws(
    () =>
      act(matched, "bank.match", {
        id: "duplicate-statement-line",
        version: 1,
        journalId: "journal-4",
      }),
    bad(409),
  );
  const closed = act(state, "period.close", ref(state.periods[0]));
  assert.throws(
    () =>
      act(closed, "transaction.post", { ...tx("Income"), date: "2025-12-31" }),
    bad(409),
  );
});
