export type Category = "Asset" | "Liability" | "Equity" | "Income" | "Expense";
export type Account = {
  id: string;
  code: string;
  name: string;
  category: Category;
};
export type Period = {
  id: string;
  version: number;
  name: string;
  start: string;
  end: string;
  closed: boolean;
};
export type Party = { id: string; name: string; kind: "Customer" | "Supplier" };
export type JournalKind =
  | "Opening"
  | "Income"
  | "Expense"
  | "Invoice"
  | "Bill"
  | "Receipt"
  | "Payment"
  | "Credit"
  | "Adjustment"
  | "Inventory purchase"
  | "Inventory sale"
  | "Reversal";
export type JournalLine = {
  accountId: string;
  debitSen: number;
  creditSen: number;
};
export type Journal = {
  id: string;
  reference: string;
  date: string;
  periodId: string;
  memo: string;
  kind: JournalKind;
  sourceId: string | null;
  amountSen: number;
  reversalOf: string | null;
  lines: JournalLine[];
  createdAt: string;
};
export type Document = {
  id: string;
  version: number;
  reference: string;
  kind: "Invoice" | "Bill";
  partyId: string;
  date: string;
  dueDate: string;
  amountSen: number;
  settledSen: number;
  creditedSen: number;
  voided: boolean;
  journalId: string;
};
export type BankTransaction = {
  id: string;
  version: number;
  date: string;
  description: string;
  amountSen: number;
  matchedJournalId: string | null;
};
export type InventoryItem = {
  id: string;
  version: number;
  name: string;
  quantity: number;
  valueSen: number;
};
export type AccountingHistory = {
  id: string;
  at: string;
  event: string;
  detail: string;
};
export type AccountingState = {
  today: string;
  accounts: Account[];
  periods: Period[];
  parties: Party[];
  journals: Journal[];
  documents: Document[];
  bankTransactions: BankTransaction[];
  inventory: InventoryItem[];
  history: AccountingHistory[];
};
export type TrialRow = Account & {
  debitSen: number;
  creditSen: number;
  balanceSen: number;
};
export type AgingRow = {
  documentId: string;
  reference: string;
  partyId: string;
  partyName: string;
  kind: "Invoice" | "Bill";
  dueDate: string;
  outstandingSen: number;
  ageDays: number;
  bucket: "Current" | "1–30" | "31–60" | "61–90" | "91+";
};
export type Reports = {
  from: string;
  to: string;
  trial: TrialRow[];
  totalDebitSen: number;
  totalCreditSen: number;
  incomeSen: number;
  expenseSen: number;
  profitSen: number;
  assetsSen: number;
  liabilitiesSen: number;
  equitySen: number;
  balanceDifferenceSen: number;
  cashSen: number;
  receivableSen: number;
  payableSen: number;
  aging: AgingRow[];
  bankStatementSen: number;
  matchedBankSen: number;
  unmatchedBankSen: number;
  inventoryValueSen: number;
  ledger: (JournalLine & {
    journalId: string;
    reference: string;
    date: string;
    memo: string;
  })[];
};
export type AccountingView = AccountingState & {
  asOf: string;
  reports: Reports;
  canManage: boolean;
};
