"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Badge, Button, Field } from "@kezuvio/ui";
import { Empty, Stats } from "../demos/shared";
import { LabShell, useLabWorkspace, type LabWorkspace } from "./platform-shell";
import type {
  AccountingView,
  Document,
  Reports,
  JournalLine,
} from "../../../../packages/accounting/model";
import { accountingReports } from "../../../../packages/accounting/reports";
import "./accounting.css";

type Props = { view: AccountingView; workspace: LabWorkspace };
const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});
const rm = (value: number) => money.format(value / 100);
const date = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value + "T00:00:00+08:00"));
const read = (form: FormData, key: string) => String(form.get(key) ?? "");
const busy = (workspace: LabWorkspace) =>
  workspace.busy || workspace.needsRefresh;
const tabs = [
  "Overview",
  "Transactions",
  "Documents",
  "Journals",
  "Reports",
  "Reconcile",
  "Inventory",
  "Accounts",
] as const;
type Tab = (typeof tabs)[number];
function sen(value: string) {
  const input = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(input))
    throw new Error("Enter an RM amount with at most two decimal places.");
  const [whole, fraction = ""] = input.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount)) throw new Error("Enter a smaller amount.");
  return amount;
}
function Choice({
  label,
  name,
  children,
  value,
  defaultValue,
  onChange,
  required = false,
}: {
  label: string;
  name: string;
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        required={required}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
      >
        {children}
      </select>
    </div>
  );
}
function Input({
  label,
  name,
  type = "text",
  defaultValue = "",
  required = true,
  help,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  help?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const id = useId();
  return (
    <Field
      id={id}
      label={label}
      name={name}
      type={type}
      defaultValue={defaultValue}
      required={required}
      help={help}
      min={min}
      max={max}
      step={step}
      inputMode={
        name.toLowerCase().includes("amount") ||
        name.includes("Cost") ||
        name.includes("Price")
          ? "decimal"
          : undefined
      }
    />
  );
}
function Form({
  title,
  workspace,
  submit,
  children,
  button = "Save",
  reset = false,
}: {
  title: string;
  workspace: LabWorkspace;
  submit: (form: FormData) => Promise<unknown>;
  children: ReactNode;
  button?: string;
  reset?: boolean;
}) {
  const id = useId();
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    try {
      if (await submit(new FormData(form))) {
        if (reset) form.reset();
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Check the entered details.",
      );
    }
  }
  return (
    <form
      className="demo-panel accounting-card accounting-form"
      aria-labelledby={id}
      onSubmit={save}
    >
      <h3 id={id}>{title}</h3>
      <fieldset className="accounting-fields" disabled={busy(workspace)}>
        {children}
      </fieldset>
      {error && (
        <p role="alert" className="accounting-form-error">
          {error}
        </p>
      )}
      <div className="labs-actions">
        <Button type="submit" disabled={busy(workspace)}>
          {button}
        </Button>
      </div>
    </form>
  );
}
function Heading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="accounting-heading">
      <div>
        <span className="eyebrow">Accounting Cloud</span>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </header>
  );
}
function Table({
  title,
  headings,
  rows,
}: {
  title: string;
  headings: string[];
  rows: ReactNode[][];
}) {
  if (!rows.length) return <Empty>No records for {title.toLowerCase()}.</Empty>;
  return (
    <div
      className="accounting-table-wrap"
      role="region"
      aria-label={title}
      tabIndex={0}
    >
      <table className="accounting-table">
        <caption>{title}</caption>
        <thead>
          <tr>
            {headings.map((heading) => (
              <th key={heading} scope="col">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Totals({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <section className="demo-panel accounting-card">
      <h3>{title}</h3>
      <dl className="accounting-totals">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{rm(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
function Overview({ view }: { view: AccountingView }) {
  const reports = view.reports;
  return (
    <>
      <Heading title="Your books at a glance">
        Fictional Meranti Studio Sdn. Bhd. · accrual accounting in MYR. Every
        total is derived from posted journal lines.
      </Heading>
      <Stats
        items={[
          { label: "Cash & bank", value: rm(reports.cashSen) },
          { label: "Receivables", value: rm(reports.receivableSen) },
          { label: "Payables", value: rm(reports.payableSen) },
          { label: "Period profit", value: rm(reports.profitSen) },
        ]}
      />
      <div className="accounting-grid">
        <Totals
          title="Balance sheet"
          rows={[
            ["Assets", reports.assetsSen],
            ["Liabilities", reports.liabilitiesSen],
            ["Equity including retained profit", reports.equitySen],
            ["Balance difference", reports.balanceDifferenceSen],
          ]}
        />
        <Totals
          title="Posted activity"
          rows={[
            ["Total debits", reports.totalDebitSen],
            ["Total credits", reports.totalCreditSen],
            ["Inventory value", reports.inventoryValueSen],
            ["Unmatched statement", reports.unmatchedBankSen],
          ]}
        />
      </div>
      <p className="accounting-notice">
        Illustrative double-entry accounting with fictional data. No tax
        calculation, filing, official e-Invoice integration or regulatory
        certification. Select Manager to explore journals and transactions;
        Viewer and Customer receive aggregate reports.
      </p>
    </>
  );
}
function Transactions({ view, workspace }: Props) {
  const [kind, setKind] = useState("Income");
  const document = kind === "Invoice" || kind === "Bill";
  const parties = view.parties.filter(
    (party) => party.kind === (kind === "Invoice" ? "Customer" : "Supplier"),
  );
  return (
    <>
      <Heading title="Post a transaction">
        Income and expenses use Bank. Invoices and bills recognise amounts when
        posted; later receipts and payments settle the control account without
        recognising income twice.
      </Heading>
      <Form
        title="New transaction"
        workspace={workspace}
        button="Post transaction"
        reset
        submit={(form) =>
          workspace.act(
            "transaction.post",
            {
              kind,
              date: read(form, "date"),
              memo: read(form, "memo"),
              partyId: document ? read(form, "party") : null,
              dueDate: document ? read(form, "due") : null,
              amountSen: sen(read(form, "amount")),
            },
            "Transaction posted with balanced journal lines.",
          )
        }
      >
        <Choice
          label="Transaction kind"
          name="kind"
          value={kind}
          onChange={setKind}
        >
          <option>Income</option>
          <option>Expense</option>
          <option>Invoice</option>
          <option>Bill</option>
        </Choice>
        <Input
          label="Transaction date"
          name="date"
          type="date"
          defaultValue={view.today}
        />
        <Input label="Amount (RM)" name="amount" />
        <Input label="Transaction memo" name="memo" />
        {document && (
          <>
            <Choice
              key={kind}
              label={kind === "Invoice" ? "Customer" : "Supplier"}
              name="party"
              defaultValue=""
              required
            >
              <option value="">
                Choose a fictional{" "}
                {kind === "Invoice" ? "customer" : "supplier"}
              </option>
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name}
                </option>
              ))}
            </Choice>
            <Input
              label="Due date"
              name="due"
              type="date"
              defaultValue={view.today}
            />
          </>
        )}
      </Form>
      <div className="accounting-notice">
        Post a customer invoice or supplier bill here, then open Documents to
        apply partial receipts/payments or an unpaid credit note. Post a
        balanced adjustment in Journals. All posted entries remain in history.
      </div>
    </>
  );
}
function DocumentCard({ item, view, workspace }: Props & { item: Document }) {
  const outstanding = item.voided
    ? 0
    : item.amountSen - item.settledSen - item.creditedSen;
  const party = view.parties.find((party) => party.id === item.partyId);
  const [editing, setEditing] = useState<"settle" | "credit" | null>(null);
  return (
    <article
      className="demo-panel accounting-card"
      data-testid={`accounting-document-${item.id}`}
    >
      <div className="accounting-card-top">
        <h3>{item.reference}</h3>
        <Badge>
          {item.voided
            ? "Voided"
            : outstanding === 0
              ? "Settled"
              : item.dueDate < view.today
                ? "Overdue"
                : "Due"}
        </Badge>
      </div>
      <p>
        {item.kind} · {party?.name}
      </p>
      <p>
        {date(item.date)} · due {date(item.dueDate)}
      </p>
      <dl className="accounting-totals">
        {[
          ["Original", item.amountSen],
          ["Settled", item.settledSen],
          ["Credited", item.creditedSen],
          ["Outstanding", outstanding],
        ].map(([label, amount]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{rm(Number(amount))}</dd>
          </div>
        ))}
      </dl>
      {outstanding > 0 && (
        <div className="labs-actions">
          <Button
            variant="secondary"
            disabled={busy(workspace)}
            onClick={() => setEditing(editing === "settle" ? null : "settle")}
          >
            {item.kind === "Invoice" ? "Record receipt" : "Record payment"}
          </Button>
          <Button
            variant="secondary"
            disabled={busy(workspace)}
            onClick={() => setEditing(editing === "credit" ? null : "credit")}
          >
            Apply credit note
          </Button>
        </div>
      )}
      {editing && (
        <Form
          key={editing}
          title={
            editing === "settle"
              ? item.kind === "Invoice"
                ? "Customer receipt"
                : "Supplier payment"
              : "Unpaid credit note"
          }
          workspace={workspace}
          button={editing === "settle" ? "Post settlement" : "Post credit note"}
          submit={async (form) => {
            const result = await workspace.act(
              editing === "settle" ? "document.settle" : "document.credit",
              {
                id: item.id,
                version: item.version,
                date: read(form, "date"),
                amountSen: sen(read(form, "amount")),
                ...(editing === "credit" ? { memo: read(form, "memo") } : {}),
              },
              editing === "settle"
                ? "Settlement posted."
                : "Credit note posted.",
            );
            if (result) setEditing(null);
            return result;
          }}
        >
          <Input
            label="Posting date"
            name="date"
            type="date"
            defaultValue={view.today}
          />
          <Input
            label="Settlement amount (RM)"
            name="amount"
            help={`Maximum outstanding ${rm(outstanding)}`}
          />
          {editing === "credit" && <Input label="Credit reason" name="memo" />}
        </Form>
      )}
    </article>
  );
}
function Documents({ view, workspace }: Props) {
  const [filter, setFilter] = useState("");
  const items = view.documents.filter(
    (item) => !filter || item.kind === filter,
  );
  const balances = view.parties.map((party) => ({
    ...party,
    amount: view.reports.aging
      .filter((row) => row.partyId === party.id)
      .reduce((sum, row) => sum + row.outstandingSen, 0),
  }));
  return (
    <>
      <Heading title="Receivables & payables">
        Track fictional customer and supplier balances, partial settlements,
        unpaid credits and aging as of {date(view.reports.to)}.
      </Heading>
      <div className="accounting-report-filters">
        <Choice
          label="Filter documents"
          name="kind"
          value={filter}
          onChange={setFilter}
        >
          <option value="">Invoices and bills</option>
          <option>Invoice</option>
          <option>Bill</option>
        </Choice>
      </div>
      <Table
        title="Customer and supplier balances"
        headings={["Party", "Kind", "Outstanding"]}
        rows={balances.map((party) => [
          party.name,
          party.kind,
          rm(party.amount),
        ])}
      />
      <div className="accounting-stack accounting-ledger">
        {items.length ? (
          items.map((item) => (
            <DocumentCard
              key={item.id}
              item={item}
              view={view}
              workspace={workspace}
            />
          ))
        ) : (
          <Empty>Create an invoice or bill in Transactions.</Empty>
        )}
      </div>
      <div className="accounting-ledger">
        <Aging reports={view.reports} />
      </div>
    </>
  );
}
function AccountsChoice({
  view,
  name,
  label,
  defaultValue,
  controls = true,
}: {
  view: AccountingView;
  name: string;
  label: string;
  defaultValue?: string;
  controls?: boolean;
}) {
  return (
    <Choice name={name} label={label} defaultValue={defaultValue} required>
      {view.accounts
        .filter(
          (account) =>
            controls ||
            !["receivable", "payable", "inventory"].includes(account.id),
        )
        .map((account) => (
          <option key={account.id} value={account.id}>
            {account.code} · {account.name}
          </option>
        ))}
    </Choice>
  );
}
function JournalForm({
  view,
  workspace,
  opening = false,
}: Props & { opening?: boolean }) {
  const [count, setCount] = useState(2);
  return (
    <Form
      title={opening ? "Opening balances" : "Balanced adjustment"}
      workspace={workspace}
      button={opening ? "Post opening balances" : "Post adjustment"}
      submit={(form) => {
        const lines: JournalLine[] = Array.from(
          { length: count },
          (_, index) => ({
            accountId: read(form, `account-${index}`),
            debitSen: sen(read(form, `debit-${index}`) || "0"),
            creditSen: sen(read(form, `credit-${index}`) || "0"),
          }),
        );
        return workspace.act(
          opening ? "opening.post" : "journal.post",
          { date: read(form, "date"), memo: read(form, "memo"), lines },
          "Balanced journal posted.",
        );
      }}
    >
      <Input
        label="Journal date"
        name="date"
        type="date"
        defaultValue={view.today}
      />
      <Input label="Journal memo" name="memo" />
      <div className="accounting-stack" style={{ gridColumn: "1 / -1" }}>
        {Array.from({ length: count }, (_, index) => (
          <div className="accounting-journal-lines" key={index}>
            <AccountsChoice
              view={view}
              controls={false}
              name={`account-${index}`}
              label={`Line ${index + 1} account`}
              defaultValue={index === 0 ? "bank" : "capital"}
            />
            <Input
              label={`Line ${index + 1} debit (RM)`}
              name={`debit-${index}`}
              defaultValue="0"
            />
            <Input
              label={`Line ${index + 1} credit (RM)`}
              name={`credit-${index}`}
              defaultValue="0"
            />
          </div>
        ))}
        <div className="labs-actions">
          <Button
            variant="secondary"
            disabled={count >= 12}
            onClick={() => setCount(count + 1)}
          >
            Add journal line
          </Button>
          {count > 2 && (
            <Button variant="secondary" onClick={() => setCount(count - 1)}>
              Remove last line
            </Button>
          )}
        </div>
      </div>
    </Form>
  );
}
function Journals({ view, workspace }: Props) {
  const [reverse, setReverse] = useState<string | null>(null);
  const accountName = (id: string) =>
    view.accounts.find((account) => account.id === id)?.name ?? id;
  return (
    <>
      <Heading title="Posted journals">
        Entries are immutable. A correction appends an equal opposite journal in
        an open period. Resolve bank matches first; inventory entries use future
        stock movements to preserve their cost history.
      </Heading>
      <JournalForm view={view} workspace={workspace} />
      <div className="accounting-stack accounting-ledger">
        {[...view.journals].reverse().map((journal) => {
          const reversed = view.journals.some(
            (other) => other.reversalOf === journal.id,
          );
          const stock =
            journal.kind === "Inventory purchase" ||
            journal.kind === "Inventory sale";
          const matched = view.bankTransactions.some(
            (line) => line.matchedJournalId === journal.id,
          );
          return (
            <article
              className="demo-panel accounting-card"
              key={journal.id}
              data-testid={`accounting-journal-${journal.id}`}
            >
              <div className="accounting-card-top">
                <h3>{journal.reference}</h3>
                <Badge>
                  {reversed
                    ? "Reversed"
                    : journal.reversalOf
                      ? "Reversal"
                      : "Posted"}
                </Badge>
              </div>
              <p>
                {journal.kind} · {date(journal.date)} · {journal.memo}
              </p>
              <Table
                title={`${journal.reference} journal lines`}
                headings={["Account", "Debit", "Credit"]}
                rows={journal.lines.map((line) => [
                  accountName(line.accountId),
                  rm(line.debitSen),
                  rm(line.creditSen),
                ])}
              />
              {!reversed && !journal.reversalOf && !stock && (
                <div className="labs-actions">
                  <Button
                    variant="secondary"
                    disabled={busy(workspace) || matched}
                    onClick={() =>
                      setReverse(reverse === journal.id ? null : journal.id)
                    }
                  >
                    Reverse journal
                  </Button>
                  {matched && (
                    <small>
                      Unmatch this posting in Reconcile before reversal.
                    </small>
                  )}
                </div>
              )}
              {stock && (
                <small>
                  Posted stock history is retained. Use a future inventory
                  movement to adjust valuation.
                </small>
              )}
              {reverse === journal.id && !reversed && (
                <Form
                  title={`Reverse ${journal.reference}`}
                  workspace={workspace}
                  button="Post reversal"
                  submit={async (form) => {
                    const result = await workspace.act(
                      "journal.reverse",
                      {
                        id: journal.id,
                        date: read(form, "date"),
                        memo: read(form, "memo"),
                      },
                      "Reversal posted. Original journal retained.",
                    );
                    if (result) setReverse(null);
                    return result;
                  }}
                >
                  <Input
                    label="Reversal date"
                    name="date"
                    type="date"
                    defaultValue={view.today}
                  />
                  <Input label="Reversal reason" name="memo" />
                </Form>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
function Aging({ reports }: { reports: Reports }) {
  return (
    <Table
      title="Outstanding aging"
      headings={["Reference", "Party", "Kind", "Due", "Bucket", "Outstanding"]}
      rows={reports.aging.map((row) => [
        row.reference,
        row.partyName,
        row.kind,
        date(row.dueDate),
        row.bucket,
        rm(row.outstandingSen),
      ])}
    />
  );
}
function ReportContent({
  reports,
  view,
}: {
  reports: Reports;
  view: AccountingView;
}) {
  const [account, setAccount] = useState("");
  return (
    <div className="accounting-stack">
      <div className="accounting-grid">
        <Totals
          title="Profit & loss"
          rows={[
            ["Income", reports.incomeSen],
            ["Expenses including COGS", reports.expenseSen],
            ["Profit", reports.profitSen],
          ]}
        />
        <Totals
          title="Balance sheet"
          rows={[
            ["Assets", reports.assetsSen],
            ["Liabilities", reports.liabilitiesSen],
            ["Equity including retained profit", reports.equitySen],
            ["Balance difference", reports.balanceDifferenceSen],
          ]}
        />
      </div>
      <Stats
        items={[
          { label: "Cash & bank", value: rm(reports.cashSen) },
          { label: "Receivables", value: rm(reports.receivableSen) },
          { label: "Payables", value: rm(reports.payableSen) },
          {
            label: "Inventory valuation",
            value: rm(reports.inventoryValueSen),
          },
        ]}
      />
      <Table
        title="Trial balance · closing balances"
        headings={[
          "Code",
          "Account",
          "Category",
          "Debit",
          "Credit",
          "Net debit",
        ]}
        rows={[
          ...reports.trial.map((row) => [
            row.code,
            row.name,
            row.category,
            rm(row.debitSen),
            rm(row.creditSen),
            rm(row.balanceSen),
          ]),
          [
            "",
            "Total",
            "",
            rm(reports.totalDebitSen),
            rm(reports.totalCreditSen),
            rm(reports.totalDebitSen - reports.totalCreditSen),
          ],
        ]}
      />
      <Aging reports={reports} />
      <Choice
        label="General ledger account"
        name="account"
        value={account}
        onChange={setAccount}
      >
        <option value="">All accounts</option>
        {view.accounts.map((item) => (
          <option key={item.id} value={item.id}>
            {item.code} · {item.name}
          </option>
        ))}
      </Choice>
      <Table
        title="General ledger · period movements"
        headings={["Date", "Reference", "Account", "Memo", "Debit", "Credit"]}
        rows={reports.ledger
          .filter((line) => !account || line.accountId === account)
          .map((line) => [
            date(line.date),
            line.reference,
            view.accounts.find((item) => item.id === line.accountId)?.name ??
              line.accountId,
            line.memo,
            rm(line.debitSen),
            rm(line.creditSen),
          ])}
      />
    </div>
  );
}
function Reporting({ view, workspace }: Props) {
  const [range, setRange] = useState({
    from: view.reports.from,
    to: view.reports.to,
  });
  const [error, setError] = useState("");
  let reports = view.reports;
  try {
    reports = accountingReports(view, range.from, range.to);
  } catch {
    /* Retain authoritative default report until valid range is submitted. */
  }
  return (
    <>
      <Heading title="Reconciled financial reports">
        Profit & loss and ledger show selected-period movements. Trial balance,
        balance sheet, cash, inventory and aging show closing balances through
        the selected end date.
      </Heading>
      <Form
        title="Report dates"
        workspace={workspace}
        button="Apply report dates"
        submit={async (form) => {
          const next = { from: read(form, "from"), to: read(form, "to") };
          try {
            accountingReports(view, next.from, next.to);
            setRange(next);
            setError("");
            return true;
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Choose a valid report range.",
            );
            return false;
          }
        }}
      >
        <Input
          label="Report from"
          name="from"
          type="date"
          defaultValue={range.from}
        />
        <Input
          label="Report to"
          name="to"
          type="date"
          defaultValue={range.to}
        />
      </Form>
      {error && (
        <p role="alert" className="accounting-form-error">
          {error}
        </p>
      )}
      <p className="accounting-muted accounting-ledger">
        Report period: {date(reports.from)} – {date(reports.to)}. All amounts
        are MYR.
      </p>
      <ReportContent reports={reports} view={view} />
    </>
  );
}
function Reconcile({ view, workspace }: Props) {
  const reports = view.reports;
  return (
    <>
      <Heading title="Bank reconciliation">
        Match fictional statement lines to exact signed Bank postings. Matching
        changes reconciliation only; it creates no balancing entry.
      </Heading>
      <Stats
        items={[
          { label: "Book Bank balance", value: rm(reports.cashSen) },
          { label: "Statement balance", value: rm(reports.bankStatementSen) },
          {
            label: "Book less statement",
            value: rm(reports.cashSen - reports.bankStatementSen),
          },
          { label: "Unmatched statement", value: rm(reports.unmatchedBankSen) },
        ]}
      />
      <div className="accounting-stack">
        {view.bankTransactions.map((line) => {
          const posted = view.journals.find(
            (journal) => journal.id === line.matchedJournalId,
          );
          const eligible = view.journals.filter(
            (journal) =>
              !journal.reversalOf &&
              !view.journals.some((other) => other.reversalOf === journal.id) &&
              !view.bankTransactions.some(
                (other) => other.matchedJournalId === journal.id,
              ) &&
              journal.lines
                .filter((entry) => entry.accountId === "bank")
                .reduce(
                  (sum, entry) => sum + entry.debitSen - entry.creditSen,
                  0,
                ) === line.amountSen,
          );
          return (
            <article
              className="demo-panel accounting-card"
              key={line.id}
              data-testid={`accounting-bank-${line.id}`}
            >
              <div className="accounting-card-top">
                <h3>{line.description}</h3>
                <Badge>{line.matchedJournalId ? "Matched" : "Unmatched"}</Badge>
              </div>
              <p>
                {date(line.date)} · {rm(line.amountSen)}
              </p>
              {posted ? (
                <>
                  <p>
                    Matched to {posted.reference} · {posted.memo}
                  </p>
                  <div className="labs-actions">
                    <Button
                      variant="secondary"
                      disabled={busy(workspace)}
                      onClick={() =>
                        void workspace.act(
                          "bank.unmatch",
                          { id: line.id, version: line.version },
                          "Bank line unmatched. Posted books retained.",
                        )
                      }
                    >
                      Unmatch bank line
                    </Button>
                  </div>
                </>
              ) : (
                <Form
                  title="Choose matching posting"
                  workspace={workspace}
                  button="Match bank line"
                  submit={(form) =>
                    workspace.act(
                      "bank.match",
                      {
                        id: line.id,
                        version: line.version,
                        journalId: read(form, "journal"),
                      },
                      "Statement line matched.",
                    )
                  }
                >
                  <Choice
                    label="Matching journal"
                    name="journal"
                    defaultValue=""
                    required
                  >
                    <option value="">Choose an exact Bank amount</option>
                    {eligible.map((journal) => (
                      <option key={journal.id} value={journal.id}>
                        {journal.reference} · {journal.memo}
                      </option>
                    ))}
                  </Choice>
                  <p className="accounting-muted">
                    {eligible.length
                      ? "Only unmatched postings with the same signed Bank amount are listed."
                      : "No unmatched posting has this exact signed Bank amount."}
                  </p>
                </Form>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
function Inventory({ view, workspace }: Props) {
  return (
    <>
      <Heading title="Inventory valuation">
        Perpetual moving weighted-average cost in integer sen. Issued cost
        rounds half up; the final issue consumes the remaining value. Stock
        postings cannot be backdated before the last stock movement.
      </Heading>
      <div className="accounting-stack">
        {view.inventory.map((item) => (
          <article
            className="demo-panel accounting-card"
            key={item.id}
            data-testid={`accounting-stock-${item.id}`}
          >
            <h3>{item.name}</h3>
            <Stats
              items={[
                { label: "Units on hand", value: item.quantity },
                { label: "Inventory value", value: rm(item.valueSen) },
              ]}
            />
            <div className="accounting-grid">
              <Form
                title="Stock purchase"
                workspace={workspace}
                button="Post stock purchase"
                reset
                submit={(form) =>
                  workspace.act(
                    "inventory.purchase",
                    {
                      id: item.id,
                      version: item.version,
                      date: read(form, "date"),
                      quantity: Number(read(form, "quantity")),
                      unitCostSen: sen(read(form, "unitCost")),
                    },
                    "Stock purchased and balanced journal posted.",
                  )
                }
              >
                <Input
                  label="Purchase date"
                  name="date"
                  type="date"
                  defaultValue={view.today}
                />
                <Input
                  label="Purchase quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  step={1}
                />
                <Input label="Unit cost (RM)" name="unitCost" />
              </Form>
              <Form
                title="Stock sale"
                workspace={workspace}
                button="Post stock sale"
                reset
                submit={(form) =>
                  workspace.act(
                    "inventory.sell",
                    {
                      id: item.id,
                      version: item.version,
                      date: read(form, "date"),
                      quantity: Number(read(form, "quantity")),
                      unitPriceSen: sen(read(form, "unitPrice")),
                    },
                    "Stock sold with weighted-average COGS.",
                  )
                }
              >
                <Input
                  label="Sale date"
                  name="date"
                  type="date"
                  defaultValue={view.today}
                />
                <Input
                  label="Sale quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  step={1}
                />
                <Input label="Unit selling price (RM)" name="unitPrice" />
              </Form>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
function Accounts({ view, workspace }: Props) {
  return (
    <>
      <Heading title="Accounts, parties & periods">
        Inspect the chart, extend fictional customer/supplier records and manage
        accounting periods. Closing a period blocks new postings in it; reset
        restores the demo fixture.
      </Heading>
      <Table
        title="Chart of accounts"
        headings={["Code", "Account", "Category"]}
        rows={view.accounts.map((account) => [
          account.code,
          account.name,
          account.category,
        ])}
      />
      <div className="accounting-grid accounting-ledger">
        <Form
          title="Add account"
          workspace={workspace}
          button="Create account"
          reset
          submit={(form) =>
            workspace.act(
              "account.create",
              {
                code: read(form, "code"),
                name: read(form, "name"),
                category: read(form, "category"),
              },
              "Account created.",
            )
          }
        >
          <Input
            label="Account code"
            name="code"
            help="Unique four-digit code"
          />
          <Input label="Account name" name="name" />
          <Choice label="Account category" name="category" defaultValue="Asset">
            {["Asset", "Liability", "Equity", "Income", "Expense"].map(
              (category) => (
                <option key={category}>{category}</option>
              ),
            )}
          </Choice>
        </Form>
        <Form
          title="Add fictional party"
          workspace={workspace}
          button="Create party"
          reset
          submit={(form) =>
            workspace.act(
              "party.create",
              { name: read(form, "name"), kind: read(form, "kind") },
              "Fictional party created.",
            )
          }
        >
          <Input label="Party name" name="name" />
          <Choice label="Party kind" name="kind" defaultValue="Customer">
            <option>Customer</option>
            <option>Supplier</option>
          </Choice>
        </Form>
      </div>
      <div className="accounting-stack accounting-ledger">
        {view.periods.map((period) => (
          <section className="demo-panel accounting-card" key={period.id}>
            <div className="accounting-card-top">
              <h3>{period.name}</h3>
              <Badge>{period.closed ? "Closed" : "Open"}</Badge>
            </div>
            <p>
              {date(period.start)} – {date(period.end)}
            </p>
            {!period.closed && (
              <>
                <p className="accounting-muted">
                  Closing is irreversible in this workspace. Match all statement
                  lines in the period before closing.
                </p>
                <div className="labs-actions">
                  <Button
                    variant="secondary"
                    disabled={busy(workspace)}
                    onClick={() =>
                      void workspace.act(
                        "period.close",
                        { id: period.id, version: period.version },
                        "Period closed. Posted entries retained.",
                      )
                    }
                  >
                    Close period
                  </Button>
                </div>
              </>
            )}
          </section>
        ))}
        <Form
          title="New accounting period"
          workspace={workspace}
          button="Create period"
          reset
          submit={(form) =>
            workspace.act(
              "period.create",
              {
                name: read(form, "name"),
                start: read(form, "start"),
                end: read(form, "end"),
              },
              "Accounting period created.",
            )
          }
        >
          <Input label="Period name" name="name" />
          <Input label="Period start" name="start" type="date" />
          <Input label="Period end" name="end" type="date" />
        </Form>
        {view.journals.length === 0 ? (
          <JournalForm view={view} workspace={workspace} opening />
        ) : (
          <p className="accounting-notice">
            Opening balances are posted once before other journals. This fixture
            already includes a balanced opening journal; inspect it in Journals.
            Posted entries are retained and corrected through controlled
            reversals.
          </p>
        )}
        <Table
          title="Recent accounting activity"
          headings={["Event", "Detail"]}
          rows={view.history.map((event) => [event.event, event.detail])}
        />
      </div>
    </>
  );
}
function Content({ view, workspace }: Props) {
  const [tab, setTab] = useState<Tab>("Overview");
  const selected = view.canManage ? tab : "Overview";
  return (
    <div className="accounting-app">
      <div
        className="accounting-nav"
        role="group"
        aria-label="Accounting views"
      >
        {(view.canManage ? tabs : (["Overview"] as const)).map((item) => (
          <Button
            key={item}
            variant={selected === item ? "primary" : "secondary"}
            aria-pressed={selected === item}
            onClick={() => setTab(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      {selected === "Overview" && <Overview view={view} />}
      {selected === "Transactions" && (
        <Transactions view={view} workspace={workspace} />
      )}
      {selected === "Documents" && (
        <Documents view={view} workspace={workspace} />
      )}
      {selected === "Journals" && (
        <Journals view={view} workspace={workspace} />
      )}
      {selected === "Reports" && (
        <Reporting view={view} workspace={workspace} />
      )}
      {selected === "Reconcile" && (
        <Reconcile view={view} workspace={workspace} />
      )}
      {selected === "Inventory" && (
        <Inventory view={view} workspace={workspace} />
      )}
      {selected === "Accounts" && (
        <Accounts view={view} workspace={workspace} />
      )}
    </div>
  );
}
export function AccountingWorkspace() {
  const workspace = useLabWorkspace("accounting-cloud");
  const packet = workspace.packet;
  return (
    <LabShell
      title="Accounting Cloud"
      category="Journals & financial reports"
      description="Post fictional transactions and follow every amount through balanced journals, receivables, inventory and reconciled financial reports."
      workspace={workspace}
      roles={["customer", "manager", "viewer"]}
    >
      {packet && (
        <Content
          key={[packet.workspaceId, packet.generation, packet.role].join(":")}
          view={packet.state as AccountingView}
          workspace={workspace}
        />
      )}
    </LabShell>
  );
}
