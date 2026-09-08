import type { AccountingState, AgingRow, Reports } from "./model.ts";

export function businessDate(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value + "T00:00:00.000Z")) ||
    new Date(value + "T00:00:00.000Z").toISOString().slice(0, 10) !== value
  )
    throw new Error("Use a valid YYYY-MM-DD business date.");
  return value;
}

/** All statement amounts derive from the same immutable posted-journal snapshot. */
export function accountingReports(
  state: AccountingState,
  from = state.periods.map((p) => p.start).sort()[0] ?? state.today,
  to = state.today,
): Reports {
  businessDate(from);
  businessDate(to);
  if (from > to) throw new Error("Report start must be on or before its end.");
  const eligible = state.journals.filter((journal) => journal.date <= to);
  const period = eligible.filter((journal) => journal.date >= from).sort((a, b) =>
    a.date.localeCompare(b.date) || a.reference.localeCompare(b.reference),
  );
  const total = (id: string, entries = eligible) =>
    entries.reduce(
      (sum, journal) =>
        sum +
        journal.lines
          .filter((line) => line.accountId === id)
          .reduce((n, line) => n + line.debitSen - line.creditSen, 0),
      0,
    );
  const category = (kind: string, entries = eligible) =>
    state.accounts
      .filter((account) => account.category === kind)
      .reduce((sum, account) => sum + total(account.id, entries), 0);
  const ledger = period.flatMap((journal) =>
    journal.lines.map((line) => ({
      ...line,
      journalId: journal.id,
      reference: journal.reference,
      date: journal.date,
      memo: journal.memo,
    })),
  );
  const trial = state.accounts.map((account) => {
    const balanceSen = total(account.id);
    return {
      ...account,
      debitSen: Math.max(0, balanceSen),
      creditSen: Math.max(0, -balanceSen),
      balanceSen,
    };
  });
  const incomeSen = -category("Income", period),
    expenseSen = category("Expense", period);
  const assetsSen = category("Asset"),
    liabilitiesSen = -category("Liability");
  const equitySen =
    -category("Equity") - category("Income") - category("Expense");
  const aging: AgingRow[] = state.documents
    .filter((document) => document.date <= to)
    .flatMap((document) => {
      const accountId = document.kind === "Invoice" ? "receivable" : "payable";
      const net = eligible
        .filter((journal) => journal.sourceId === document.id)
        .reduce(
          (sum, journal) =>
            sum +
            journal.lines
              .filter((line) => line.accountId === accountId)
              .reduce((n, line) => n + line.debitSen - line.creditSen, 0),
          0,
        );
      const outstandingSen = document.kind === "Invoice" ? net : -net;
      if (outstandingSen <= 0) return [];
      const ageDays = Math.max(
        0,
        Math.floor((Date.parse(to) - Date.parse(document.dueDate)) / 86400000),
      );
      const bucket =
        document.dueDate >= to
          ? "Current"
          : ageDays <= 30
            ? "1–30"
            : ageDays <= 60
              ? "31–60"
              : ageDays <= 90
                ? "61–90"
                : "91+";
      return [
        {
          documentId: document.id,
          reference: document.reference,
          partyId: document.partyId,
          partyName:
            state.parties.find((party) => party.id === document.partyId)
              ?.name ?? "Historical party",
          kind: document.kind,
          dueDate: document.dueDate,
          outstandingSen,
          ageDays,
          bucket,
        },
      ];
    });
  const bank = state.bankTransactions.filter((row) => row.date <= to);
  return {
    from,
    to,
    trial,
    totalDebitSen: trial.reduce((sum, row) => sum + row.debitSen, 0),
    totalCreditSen: trial.reduce((sum, row) => sum + row.creditSen, 0),
    incomeSen,
    expenseSen,
    profitSen: incomeSen - expenseSen,
    assetsSen,
    liabilitiesSen,
    equitySen,
    balanceDifferenceSen: assetsSen - liabilitiesSen - equitySen,
    cashSen: total("bank"),
    receivableSen: total("receivable"),
    payableSen: -total("payable"),
    aging,
    bankStatementSen: bank.reduce((sum, row) => sum + row.amountSen, 0),
    matchedBankSen: bank
      .filter((row) => row.matchedJournalId)
      .reduce((sum, row) => sum + row.amountSen, 0),
    unmatchedBankSen: bank
      .filter((row) => !row.matchedJournalId)
      .reduce((sum, row) => sum + row.amountSen, 0),
    inventoryValueSen: total("inventory"),
    ledger,
  };
}
