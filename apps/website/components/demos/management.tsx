"use client";
import { useState } from "react";
import { Button, Field } from "@kezuvio/ui";
import { money, totals } from "@/lib/demo/engine";
import { Empty, RoleNote, Select, Stats, type DemoProps } from "./shared";
export function ManagementDemo({ state, act, busy }: DemoProps) {
  const [tab, setTab] = useState("overview"),
    [kind, setKind] = useState("Income"),
    [amount, setAmount] = useState("250"),
    [note, setNote] = useState("Sample service work"),
    [category, setCategory] = useState("Services"),
    [customer, setCustomer] = useState("C-001"),
    [invoiceAmount, setInvoiceAmount] = useState("450"),
    [description, setDescription] = useState("Sample design services"),
    [selectedInvoice, setSelectedInvoice] = useState(""),
    [stock, setStock] = useState<Record<string, string>>({});
  const t = totals(state),
    invoice = state.invoices.find((i) => i.id === selectedInvoice);
  return (
    <>
      <div className="demo-tablist" role="group" aria-label="Management views">
        {["overview", "ledger", "invoices", "contacts", "stock", "audit"].map(
          (id) => (
            <Button
              key={id}
              variant={tab === id ? "primary" : "secondary"}
              onClick={() => setTab(id)}
            >
              {id[0].toUpperCase() + id.slice(1)}
            </Button>
          ),
        )}
      </div>
      <Stats
        items={[
          {
            label: "Cash-basis income",
            value: money(t.income),
            detail: "Sales + ledger income",
          },
          { label: "Expenses", value: money(t.expenses) },
          { label: "Profit / loss", value: money(t.profit) },
          {
            label: "Unpaid invoices",
            value: money(t.receivables),
            detail: "Excluded from income until paid",
          },
        ]}
      />
      {tab === "overview" && (
        <div className="management-overview">
          <section className="demo-panel">
            <span className="eyebrow">A clearer picture</span>
            <h2>Every number has a place.</h2>
            <div className="reconciliation">
              <div>
                <span>POS + shop net sales</span>
                <strong>{money(t.salesIncome)}</strong>
              </div>
              <div>
                <span>Manual & paid-invoice income</span>
                <strong>{money(t.manualIncome)}</strong>
              </div>
              <div>
                <span>Total cash-basis income</span>
                <strong>{money(t.income)}</strong>
              </div>
              <div>
                <span>Expenses</span>
                <strong>−{money(t.expenses)}</strong>
              </div>
              <div>
                <span>Profit / loss</span>
                <strong>{money(t.profit)}</strong>
              </div>
            </div>
            <p className="notice">
              Cash-basis illustration only. Unpaid invoices are receivables, not
              income. QR meal orders are a separate scenario and do not feed
              this ledger. No tax, accounting-standard or LHDN e-Invoice
              compliance is claimed.
            </p>
          </section>
          <section className="demo-panel">
            <h2>Your workspace</h2>
            <div className="workspace-summary">
              <div>
                <strong>{state.products.length}</strong>
                <span>Products</span>
              </div>
              <div>
                <strong>
                  {state.contacts.filter((c) => c.kind === "Customer").length}
                </strong>
                <span>Customers</span>
              </div>
              <div>
                <strong>
                  {state.contacts.filter((c) => c.kind === "Supplier").length}
                </strong>
                <span>Suppliers</span>
              </div>
              <div>
                <strong>{state.invoices.length}</strong>
                <span>Invoices</span>
              </div>
            </div>
            <RoleNote state={state} />
          </section>
        </div>
      )}
      {tab === "ledger" && (
        <>
          <form
            className="demo-panel entry-form"
            onSubmit={(e) => {
              e.preventDefault();
              act(
                "entry.add",
                {
                  kind,
                  category,
                  note,
                  amount: Math.round(Number(amount) * 100),
                },
                "Sample ledger entry saved. Totals reconciled.",
              );
            }}
          >
            <h2>Add a sample entry</h2>
            <div className="form-row">
              <Select
                id="entry-kind"
                label="Entry type"
                value={kind}
                onChange={setKind}
              >
                <option>Income</option>
                <option>Expense</option>
              </Select>
              <Field
                id="entry-amount"
                label="Amount (RM)"
                type="number"
                min="0.01"
                max="10000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <Field
                id="entry-category"
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={40}
                required
              />
              <Field
                id="entry-note"
                label="Fictional description"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={160}
                required
              />
            </div>
            <Button type="submit" disabled={busy || state.role !== "manager"}>
              Add ledger entry
            </Button>
            <RoleNote state={state} />
          </form>
          <section className="demo-panel">
            <h2>Cash ledger</h2>
            <div className="table-wrap">
              <table>
                <caption className="sr-only">
                  Manual and paid-invoice ledger entries
                </caption>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {state.entries.map((e) => (
                    <tr key={e.id}>
                      <th scope="row">{e.id}</th>
                      <td>
                        {e.note}
                        <small>{e.category}</small>
                      </td>
                      <td>{e.kind}</td>
                      <td>{money(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      {tab === "invoices" && (
        <>
          <form
            className="demo-panel entry-form"
            onSubmit={(e) => {
              e.preventDefault();
              act(
                "invoice.create",
                {
                  customer,
                  description,
                  amount: Math.round(Number(invoiceAmount) * 100),
                },
                "Sample invoice created. It remains outside income until marked paid.",
              );
            }}
          >
            <h2>Create a sample invoice</h2>
            <div className="form-row">
              <Select
                id="invoice-customer"
                label="Sample customer"
                value={customer}
                onChange={setCustomer}
              >
                {state.contacts
                  .filter((c) => c.kind === "Customer")
                  .map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
              <Field
                id="invoice-amount"
                label="Invoice amount (RM)"
                type="number"
                min="0.01"
                max="10000"
                step="0.01"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                required
              />
            </div>
            <Field
              id="invoice-description"
              label="Fictional invoice description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={160}
              required
            />
            <Button type="submit" disabled={busy || state.role === "viewer"}>
              Create invoice
            </Button>
          </form>
          <section className="demo-panel">
            <h2>Invoices</h2>
            {state.invoices.length ? (
              <div className="record-list">
                {state.invoices.map((i) => (
                  <article key={i.id}>
                    <div>
                      <strong>
                        {i.id} · {i.customer}
                      </strong>
                      <p>{i.description}</p>
                      <span className="status-tag">
                        {i.paid ? "Paid (simulated)" : "Unpaid"}
                      </span>
                    </div>
                    <strong>{money(i.amount)}</strong>
                    <div className="button-row">
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedInvoice(i.id)}
                      >
                        View invoice
                      </Button>
                      <Button
                        disabled={busy || state.role !== "manager" || i.paid}
                        onClick={() =>
                          act(
                            "invoice.pay",
                            { id: i.id },
                            "Invoice payment simulated and posted once to income.",
                          )
                        }
                      >
                        {i.paid ? "Paid" : "Mark paid"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>Create your first sample invoice above.</Empty>
            )}
          </section>
          {invoice && (
            <section className="demo-panel receipt-panel">
              <div className="panel-heading">
                <h2>Invoice preview</h2>
                <Button variant="secondary" onClick={() => window.print()}>
                  Print invoice
                </Button>
              </div>
              <div id="demo-print">
                <span className="demo-pill">DEMO MODE · NOT A TAX INVOICE</span>
                <h3>Alur sample invoice</h3>
                <p>
                  {invoice.id} · {invoice.customer}
                </p>
                <div className="receipt-lines">
                  <div>
                    <span>{invoice.description}</span>
                    <strong>{money(invoice.amount)}</strong>
                  </div>
                  <div>
                    <span>Total · No tax applied</span>
                    <strong>{money(invoice.amount)}</strong>
                  </div>
                </div>
                <p>
                  {invoice.paid
                    ? "Paid in simulation. No money was transferred."
                    : "Unpaid sample invoice. Do not use for real billing."}
                </p>
                <small>
                  No LHDN e-Invoice integration or compliance is represented.
                </small>
              </div>
            </section>
          )}
        </>
      )}
      {tab === "contacts" && (
        <section className="demo-panel">
          <div className="panel-heading">
            <h2>Sample contacts</h2>
            <div className="button-row">
              <Button
                disabled={busy || state.role === "viewer"}
                onClick={() =>
                  act(
                    "contact.add",
                    { kind: "Customer" },
                    "Fictional customer added.",
                  )
                }
              >
                Add sample customer
              </Button>
              <Button
                variant="secondary"
                disabled={busy || state.role === "viewer"}
                onClick={() =>
                  act(
                    "contact.add",
                    { kind: "Supplier" },
                    "Fictional supplier added.",
                  )
                }
              >
                Add sample supplier
              </Button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <caption className="sr-only">
                Fictional customers and suppliers
              </caption>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Fictional email</th>
                </tr>
              </thead>
              <tbody>
                {state.contacts.map((c) => (
                  <tr key={c.id}>
                    <th scope="row">{c.name}</th>
                    <td>{c.kind}</td>
                    <td>{c.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "stock" && (
        <section className="demo-panel">
          <h2>Stock management</h2>
          <p>
            Changes affect the POS and e-commerce catalogue in this sample
            workspace.
          </p>
          <div className="stock-grid">
            {state.products.map((p) => (
              <form
                key={p.id}
                onSubmit={(e) => {
                  e.preventDefault();
                  act(
                    "stock.adjust",
                    { id: p.id, stock: Number(stock[p.id] ?? p.stock) },
                    `${p.name} stock updated.`,
                  );
                }}
              >
                <strong>{p.name}</strong>
                <p>
                  Current stock: {p.stock} · {money(p.price)}
                </p>
                <Field
                  id={`stock-${p.id}`}
                  label={`New stock for ${p.name}`}
                  type="number"
                  min="0"
                  max="999"
                  step="1"
                  value={stock[p.id] ?? String(p.stock)}
                  onChange={(e) =>
                    setStock({ ...stock, [p.id]: e.target.value })
                  }
                  required
                />
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={busy || state.role !== "manager"}
                >
                  Update stock
                </Button>
              </form>
            ))}
          </div>
        </section>
      )}
      {tab === "audit" && (
        <section className="demo-panel">
          <h2>Sample audit history</h2>
          <p>
            Up to 100 recent events, in reverse order. This is a session-local
            demonstration, not an immutable compliance log.
          </p>
          {state.audit.length ? (
            <ol className="audit-list">
              {state.audit.map((a) => (
                <li key={a.id}>
                  <span>{a.id}</span>
                  <div>
                    <strong>{a.event}</strong>
                    <small>Demo role: {a.role}</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <Empty>Complete an action to see its audit event.</Empty>
          )}
        </section>
      )}
    </>
  );
}
