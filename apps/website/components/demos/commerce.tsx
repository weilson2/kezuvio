"use client";
import { useState } from "react";
import { Button, Field } from "@kezuvio/ui";
import { cartTotal, cashExpected, money } from "@/lib/demo/engine";
import {
  Cart,
  Empty,
  ProductTile,
  Receipt,
  RoleNote,
  Select,
  Stats,
  type DemoProps,
} from "./shared";
export function CommerceDemo(props: DemoProps & { kind: "pos" | "shop" }) {
  const { state, act, busy, kind } = props;
  const [tab, setTab] = useState("catalogue"),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All"),
    [discount, setDiscount] = useState("0"),
    [code, setCode] = useState(""),
    [method, setMethod] = useState(kind === "pos" ? "Cash" : "Card"),
    [tender, setTender] = useState("100"),
    [opening, setOpening] = useState("100"),
    [receipt, setReceipt] = useState("");
  const items = state.products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const sales = state.sales.filter((s) => s.kind === kind);
  const completed = sales.filter((s) => !s.refunded);
  const gross = sales.reduce((n, s) => n + s.total, 0);
  const refunded = sales
    .filter((s) => s.refunded)
    .reduce((n, s) => n + s.total, 0);
  const subtotal = cartTotal(state.carts[kind]);
  const percent =
    kind === "pos" ? Number(discount) : code === "EVOLVE10" ? 10 : 0;
  const saving = Math.round((subtotal * percent) / 100);
  const total = subtotal - saving;
  const chosen = sales.find((s) => s.id === receipt);
  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    const next = await act(
      "checkout",
      {
        kind,
        discount: Number(discount),
        code,
        method,
        tender: Math.round(Number(tender) * 100),
      },
      "Simulated checkout complete. No money was charged.",
    );
    if (next) {
      setReceipt(next.sales[0].id);
      setTab("history");
    }
  }
  return (
    <>
      <div className="demo-tablist" role="group" aria-label="Commerce views">
        {[
          ["catalogue", kind === "pos" ? "Checkout counter" : "Shop catalogue"],
          ["history", kind === "pos" ? "Sales & receipts" : "Order history"],
          ["reports", "Sales report"],
          ["inventory", "Inventory"],
        ].map(([id, label]) => (
          <Button
            key={id}
            variant={tab === id ? "primary" : "secondary"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {kind === "pos" && (
        <section className="shift-bar">
          <div>
            <strong>
              Shift {state.shift.number || "—"} ·{" "}
              {state.shift.open ? "Open" : "Closed"}
            </strong>
            <p>
              {state.shift.open
                ? `Expected cash: ${money(cashExpected(state))}`
                : state.shift.closedCash !== null
                  ? `Last closing cash: ${money(state.shift.closedCash)}`
                  : "Open a sample shift before making a sale."}
            </p>
          </div>
          {!state.shift.open ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act(
                  "shift.open",
                  { amount: Math.round(Number(opening) * 100) },
                  "Sample shift opened.",
                );
              }}
            >
              <Field
                id="opening-cash"
                label="Opening cash (RM)"
                type="number"
                min="0"
                max="1000"
                step="0.01"
                value={opening}
                onChange={(e) => setOpening(e.target.value)}
                required
              />
              <Button type="submit" disabled={busy || state.role === "viewer"}>
                Open shift
              </Button>
            </form>
          ) : (
            <Button
              variant="secondary"
              disabled={busy || state.role !== "manager"}
              onClick={() =>
                act(
                  "shift.close",
                  {},
                  "Shift closed with the expected sample cash balance.",
                )
              }
            >
              Close shift
            </Button>
          )}
        </section>
      )}
      {tab === "catalogue" && (
        <>
          <div className="demo-toolbar">
            <div>
              <span className="eyebrow">
                {kind === "pos"
                  ? "Kedai / Counter"
                  : "Kedai / Everyday essentials"}
              </span>
              <h2>
                {kind === "pos"
                  ? "A clear checkout. A calmer counter."
                  : "Small things. Thoughtfully chosen."}
              </h2>
              <p>
                {kind === "pos"
                  ? "Select products, adjust the cart and simulate a sale."
                  : "Fictional goods for a familiar shopping journey. Try EVOLVE10 for 10% off."}
              </p>
            </div>
            <Field
              id="product-search"
              type="search"
              label="Search products"
              placeholder="Try notebook…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div
            className="filter-row"
            role="group"
            aria-label="Product categories"
          >
            {["All", "Stationery", "Home", "Accessories"].map((c) => (
              <button
                key={c}
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="catalogue-layout">
            <div>
              {items.length ? (
                <div className="demo-product-grid">
                  {items.map((p) => (
                    <ProductTile key={p.id} product={p}>
                      <details className="product-details">
                        <summary>Product details</summary>
                        <p>
                          {p.description} Demonstration item only; nothing is
                          shipped. Item code: {p.id.toUpperCase()}.
                        </p>
                      </details>
                      <Button
                        disabled={
                          busy ||
                          p.stock === 0 ||
                          (kind === "pos" && state.role === "viewer")
                        }
                        onClick={() =>
                          act(
                            "cart.add",
                            { kind, productId: p.id },
                            `${p.name} added to your cart.`,
                          )
                        }
                      >
                        Add {p.name}
                      </Button>
                    </ProductTile>
                  ))}
                </div>
              ) : (
                <Empty>
                  No products match your search. Try another category or term.
                </Empty>
              )}
            </div>
            <Cart {...props} kind={kind}>
              <form className="checkout-form" onSubmit={checkout}>
                {kind === "pos" ? (
                  <Select
                    id="sale-discount"
                    label="Discount"
                    value={discount}
                    onChange={setDiscount}
                  >
                    <option value="0">No discount</option>
                    <option value="10">10% discount</option>
                    {state.role === "manager" && (
                      <option value="20">20% manager discount</option>
                    )}
                  </Select>
                ) : (
                  <Field
                    id="discount-code"
                    label="Sample discount code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="EVOLVE10"
                    maxLength={20}
                  />
                )}
                <Select
                  id="payment-method"
                  label="Simulated payment"
                  value={method}
                  onChange={setMethod}
                >
                  {(kind === "pos"
                    ? ["Cash", "Card", "QR"]
                    : ["Card", "QR"]
                  ).map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
                {method === "Cash" && (
                  <Field
                    id="cash-tender"
                    label="Cash tendered (RM)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10000"
                    value={tender}
                    onChange={(e) => setTender(e.target.value)}
                    required
                  />
                )}
                {kind === "shop" && (
                  <p className="notice">
                    Checkout as Sample Guest. Delivery and payment details are
                    fictional; no card information is collected.
                  </p>
                )}
                <div className="checkout-totals">
                  <div>
                    <span>Discount preview</span>
                    <span>−{money(saving)}</span>
                  </div>
                  <div>
                    <strong>Total</strong>
                    <strong>{money(total)}</strong>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={
                    busy ||
                    !state.carts[kind].length ||
                    (kind === "pos" &&
                      (!state.shift.open || state.role === "viewer"))
                  }
                >
                  Simulate checkout
                </Button>
              </form>
            </Cart>
          </div>
        </>
      )}
      {tab === "history" && (
        <>
          <section className="demo-panel">
            <div className="panel-heading">
              <h2>{kind === "pos" ? "Sales history" : "Your sample orders"}</h2>
              <span className="badge">{sales.length} records</span>
            </div>
            {sales.length ? (
              <div className="record-list">
                {sales.map((s) => (
                  <article key={s.id}>
                    <div>
                      <strong>{s.id}</strong>
                      <p>
                        {s.lines.map((l) => `${l.qty} × ${l.name}`).join(", ")}
                      </p>
                      <small>
                        {s.method} simulation · {s.status}
                      </small>
                    </div>
                    <strong>{money(s.total)}</strong>
                    <div className="button-row">
                      <Button
                        variant="secondary"
                        onClick={() => setReceipt(s.id)}
                      >
                        View receipt
                      </Button>
                      {kind === "shop" &&
                        s.status !== "Shipped" &&
                        !s.refunded && (
                          <Button
                            variant="secondary"
                            disabled={busy || state.role === "viewer"}
                            onClick={() =>
                              act(
                                "sale.status",
                                { id: s.id },
                                "Sample order fulfilment updated.",
                              )
                            }
                          >
                            {s.status === "Paid" ? "Pack order" : "Ship order"}
                          </Button>
                        )}
                      <Button
                        variant="secondary"
                        disabled={
                          busy || state.role !== "manager" || s.refunded
                        }
                        onClick={() =>
                          act(
                            "sale.refund",
                            { id: s.id },
                            "Full simulated refund recorded. Inventory and net sales updated.",
                          )
                        }
                      >
                        {s.refunded ? "Refunded" : "Full refund"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>
                Complete a simulated checkout to see a receipt here.
              </Empty>
            )}
            <RoleNote state={state} />
          </section>
          {chosen && <Receipt sale={chosen} />}
        </>
      )}
      {tab === "reports" && (
        <>
          <Stats
            items={[
              { label: "Gross completed sales", value: money(gross) },
              { label: "Refunded", value: money(refunded) },
              { label: "Net sales", value: money(gross - refunded) },
              { label: "Active orders", value: completed.length },
            ]}
          />
          <section className="demo-panel">
            <h2>Sales by simulated payment</h2>
            <div className="report-bars">
              {["Cash", "Card", "QR"].map((m) => {
                const sum = completed
                  .filter((s) => s.method === m)
                  .reduce((n, s) => n + s.total, 0);
                return (
                  <div key={m}>
                    <span>{m}</span>
                    <div>
                      <i
                        style={{
                          width: `${gross - refunded ? (sum / (gross - refunded)) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <strong>{money(sum)}</strong>
                  </div>
                );
              })}
            </div>
            <p className="notice">
              Net sales = completed checkout totals − full refunds. Discounts
              are already deducted. All amounts are fictional and exclude taxes
              and delivery.
            </p>
          </section>
        </>
      )}
      {tab === "inventory" && (
        <section className="demo-panel">
          <h2>Shared sample inventory</h2>
          <p>
            POS and e-commerce use the same stock within your visitor workspace.
            Checkout reduces stock; a full refund restores it.
          </p>
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Sample inventory</caption>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {state.products.map((p) => (
                  <tr key={p.id}>
                    <th scope="row">{p.name}</th>
                    <td>{p.category}</td>
                    <td>{money(p.price)}</td>
                    <td>{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
