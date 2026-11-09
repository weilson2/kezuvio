"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field } from "@kezuvio/ui";
import { quotePayment } from "../../../../packages/cafe/pricing";
import type {
  CafeItem,
  CafeOrderView,
  CafeView,
} from "../../../../packages/cafe/index";
import { LabShell, useLabWorkspace, type LabWorkspace } from "./platform-shell";
import "./cafe.css";

type Area = "menu" | "kitchen" | "cashier" | "inventory" | "reports";
const labels: Record<Area, string> = {
  menu: "Table menu",
  kitchen: "Kitchen",
  cashier: "Cashier",
  inventory: "Inventory",
  reports: "Sales report",
};
const money = (sen = 0) =>
  new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(
    sen / 100,
  );
const time = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
const sen = (value: string) => Math.round(Number(value) * 100);
const title = (item: Pick<CafeItem, "name" | "variant">) =>
  `${item.name} · ${item.variant}`;
type ViewProps = { view: CafeView; workspace: LabWorkspace };

function OrderStatus({ order }: { order: CafeOrderView }) {
  return (
    <span className={`cafe-status cafe-status-${order.status.toLowerCase()}`}>
      {order.refunded ? "Refunded" : order.status}
      <span className="cafe-payment-state">
        {order.refunded ? "Payment reversed" : order.paid ? "Paid" : "Unpaid"}
      </span>
    </span>
  );
}

function OrderLines({
  order,
  prices = false,
}: {
  order: CafeOrderView;
  prices?: boolean;
}) {
  return (
    <ul className="cafe-order-lines">
      {order.lines.map((line) => (
        <li key={line.itemId}>
          <span>
            <b>{line.qty}×</b> {line.name}
            <small>{line.variant}</small>
          </span>
          {prices && typeof line.unitPriceSen === "number" && (
            <strong>{money(line.qty * line.unitPriceSen)}</strong>
          )}
        </li>
      ))}
    </ul>
  );
}

function Empty({ heading, children }: { heading: string; children: string }) {
  return (
    <div className="cafe-empty">
      <span aria-hidden="true">○</span>
      <h3>{heading}</h3>
      <p>{children}</p>
    </div>
  );
}

function TableMenu({ view, workspace }: ViewProps) {
  const [table, setTable] = useState(1),
    [category, setCategory] = useState("All"),
    [cart, setCart] = useState<Record<string, number>>({});
  const [qrError, setQrError] = useState(false);
  useEffect(() => {
    const value = Number(
      new URLSearchParams(window.location.search).get("table"),
    );
    if (Number.isInteger(value) && value >= 1 && value <= 6) setTable(value);
  }, []);
  useEffect(() => {
    setCart({});
  }, [workspace.packet?.workspaceId, workspace.packet?.generation]);
  const disabled = workspace.busy || workspace.needsRefresh;
  const lines = view.menu.filter((item) => cart[item.id] > 0);
  const subtotal = lines.reduce(
    (sum, item) => sum + item.priceSen * cart[item.id],
    0,
  );
  const quantities = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const change = (id: string, amount: number) =>
    setCart((current) => ({
      ...current,
      [id]: Math.max(0, Math.min(20, (current[id] || 0) + amount)),
    }));
  async function submit() {
    const packet = await workspace.act(
      "order.submit",
      {
        table,
        lines: lines.map((item) => ({ itemId: item.id, qty: cart[item.id] })),
      },
      "Order accepted. Follow its progress below.",
    );
    if (packet) setCart({});
  }
  return (
    <>
      <div className="cafe-menu-layout">
        <div>
          <div className="cafe-section-heading">
            <div>
              <span className="cafe-overline">Made for a good break</span>
              <h2>Fresh favourites, your way.</h2>
              <p>
                Choose a table, add a few favourites and send them to the
                kitchen.
              </p>
            </div>
            <div className="field cafe-table-select">
              <label htmlFor="cafe-table">Your table</label>
              <select
                id="cafe-table"
                value={table}
                onChange={(event) => {
                  setTable(Number(event.target.value));
                  setQrError(false);
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    Table {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="cafe-categories" aria-label="Menu categories">
            {["All", "Drinks", "Food", "Bakery"].map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="cafe-menu-grid">
            {view.menu
              .filter(
                (item) => category === "All" || item.category === category,
              )
              .map((item) => {
                const available = item.onHand - item.reserved;
                return (
                  <Card key={item.id} className="cafe-menu-item">
                    <div
                      className={`cafe-item-mark cafe-mark-${item.category.toLowerCase()}`}
                      aria-hidden="true"
                    >
                      {item.category === "Drinks"
                        ? "◡"
                        : item.category === "Food"
                          ? "◉"
                          : "⌁"}
                    </div>
                    <div className="cafe-item-top">
                      <span className="cafe-overline">{item.category}</span>
                      <small className={available < 5 ? "cafe-low-stock" : ""}>
                        {available ? `${available} available` : "Sold out"}
                      </small>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.variant}</p>
                    <div className="cafe-item-bottom">
                      <strong>{money(item.priceSen)}</strong>
                      <Button
                        variant="secondary"
                        disabled={
                          disabled ||
                          available <= (cart[item.id] || 0) ||
                          (cart[item.id] || 0) >= 20
                        }
                        aria-label={`Add ${item.name} ${item.variant}`}
                        onClick={() => change(item.id, 1)}
                      >
                        Add <span aria-hidden="true">+</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
        <aside className="cafe-cart-stack">
          <Card className="cafe-cart">
            <div className="cafe-panel-heading">
              <h2>Your order</h2>
              <span className="cafe-count">{quantities}</span>
            </div>
            <p>Table {table} · Pay at the cashier</p>
            {lines.length ? (
              <>
                <ul className="cafe-cart-lines">
                  {lines.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <small>
                          {item.variant} · {money(item.priceSen)}
                        </small>
                      </div>
                      <div className="cafe-quantity">
                        <button
                          type="button"
                          disabled={disabled}
                          aria-label={`Decrease ${item.name} ${item.variant}`}
                          onClick={() => change(item.id, -1)}
                        >
                          −
                        </button>
                        <span aria-label={`${cart[item.id]} in cart`}>
                          {cart[item.id]}
                        </span>
                        <button
                          type="button"
                          disabled={
                            disabled ||
                            cart[item.id] >=
                              Math.min(20, item.onHand - item.reserved)
                          }
                          aria-label={`Increase ${item.name} ${item.variant}`}
                          onClick={() => change(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="cafe-total">
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <Button disabled={disabled} onClick={() => void submit()}>
                  Place demo order
                </Button>
                <p className="cafe-fine-print">
                  Stock is reserved when your order is accepted. No payment is
                  taken here.
                </p>
              </>
            ) : (
              <Empty heading="Something good starts here">
                Add an item from the menu to start your order.
              </Empty>
            )}
          </Card>
          <details className="cafe-qr">
            <summary>Table {table} QR menu</summary>
            <div>
              {qrError ? (
                <p>The QR image could not load. Use the table link below.</p>
              ) : (
                <img
                  src={`/api/labs/cafe-pos/qr?table=${table}`}
                  width="160"
                  height="160"
                  alt={`QR code for the Table ${table} menu`}
                  onError={() => setQrError(true)}
                />
              )}
              <a href={`/demo/cafe-pos?table=${table}`}>
                Open table {table} menu
              </a>
              <p>
                This local QR opens on this computer; other devices need an
                approved reachable host.
              </p>
              <p>A new browser receives its own fictional workspace.</p>
            </div>
          </details>
        </aside>
      </div>
      <section
        className="cafe-orders-section"
        aria-labelledby="cafe-your-orders"
      >
        <div className="cafe-section-heading">
          <div>
            <span className="cafe-overline">From order to table</span>
            <h2 id="cafe-your-orders">Your orders</h2>
          </div>
          <p>Updates every few seconds while this tab is visible.</p>
        </div>
        {view.orders.length ? (
          <div className="cafe-order-grid">
            {[...view.orders].reverse().map((order) => (
              <Card key={order.id} className="cafe-ticket">
                <div className="cafe-ticket-heading">
                  <div>
                    <h3>Order {order.number}</h3>
                    <small>
                      Table {order.table} · {time(order.createdAt)}
                    </small>
                  </div>
                  <OrderStatus order={order} />
                </div>
                <OrderLines order={order} prices />
                <div className="cafe-total">
                  <span>{order.payment ? "Paid total" : "Subtotal"}</span>
                  <strong>
                    {money(order.payment?.totalSen ?? order.subtotalSen)}
                  </strong>
                </div>
                {!order.paid && order.status === "Received" && (
                  <Button
                    variant="secondary"
                    disabled={disabled}
                    onClick={() =>
                      void workspace.act(
                        "order.cancel",
                        { id: order.id },
                        "Unpaid order cancelled. Reserved stock released.",
                      )
                    }
                  >
                    Cancel order {order.number}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Empty heading="No orders yet">
            Your accepted orders and kitchen updates will appear here.
          </Empty>
        )}
      </section>
    </>
  );
}

function Kitchen({ view, workspace }: ViewProps) {
  const disabled = workspace.busy || workspace.needsRefresh;
  const statuses = ["Received", "Preparing", "Ready", "Served"] as const;
  const nextLabel = {
    Received: "Start preparing",
    Preparing: "Mark ready",
    Ready: "Mark served",
  };
  const orders = view.orders.filter(
    (order) => order.status !== "Cancelled" && !order.refunded,
  );
  return (
    <section>
      <div className="cafe-section-heading">
        <div>
          <span className="cafe-overline">Kitchen display</span>
          <h2>Every ticket, one clear next step.</h2>
          <p>Preparation and payment are tracked separately.</p>
        </div>
        <span className="cafe-live">
          <i />
          Live workspace
        </span>
      </div>
      <div className="cafe-kitchen-grid">
        {statuses.map((status) => (
          <section
            className="cafe-kitchen-lane"
            key={status}
            aria-label={`${status} orders`}
          >
            <div className="cafe-lane-heading">
              <h3>{status}</h3>
              <span>
                {orders.filter((order) => order.status === status).length}
              </span>
            </div>
            {orders.filter((order) => order.status === status).length === 0 ? (
              <p className="cafe-lane-empty">
                No {status.toLowerCase()} tickets.
              </p>
            ) : (
              orders
                .filter((order) => order.status === status)
                .map((order) => (
                  <Card key={order.id} className="cafe-ticket">
                    <div className="cafe-ticket-heading">
                      <div>
                        <h4>Table {order.table}</h4>
                        <small>
                          Order {order.number} · {time(order.createdAt)}
                        </small>
                      </div>
                      <span className="cafe-mini-status">
                        {order.paid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                    <OrderLines order={order} />
                    {status !== "Served" && (
                      <Button
                        disabled={disabled}
                        onClick={() =>
                          void workspace.act(
                            "order.advance",
                            { id: order.id },
                            `Order ${order.number} updated.`,
                          )
                        }
                      >
                        {nextLabel[status]}
                      </Button>
                    )}
                    {workspace.packet?.role === "manager" && !order.paid && (
                      <button
                        type="button"
                        className="cafe-text-button"
                        disabled={disabled}
                        onClick={() =>
                          void workspace.act(
                            "order.cancel",
                            { id: order.id },
                            status === "Received"
                              ? "Order cancelled; reservations released."
                              : "Order cancelled; prepared stock recorded as waste.",
                          )
                        }
                      >
                        {status === "Received"
                          ? "Cancel unpaid order"
                          : "Cancel and record waste"}
                      </button>
                    )}
                  </Card>
                ))
            )}
          </section>
        ))}
      </div>
      {view.orders.some(
        (order) => order.refunded || order.status === "Cancelled",
      ) && (
        <p className="cafe-fine-print cafe-kitchen-footnote">
          Cancelled and refunded orders are removed from preparation. Their
          history remains in the cashier view.
        </p>
      )}
    </section>
  );
}

function Receipt({ order }: { order: CafeOrderView }) {
  if (!order.payment) return null;
  return (
    <section
      id="cafe-receipt"
      className="cafe-receipt"
      aria-label={`Receipt for order ${order.number}`}
    >
      <div className="cafe-receipt-brand">
        <span>Saji</span>
        <h3>CAFÉ</h3>
        <p>Fictional demonstration · No real payment</p>
      </div>
      <div className="cafe-receipt-reference">
        <strong>Receipt · Order {order.number}</strong>
        <span>
          Table {order.table} · {time(order.payment.paidAt)}
        </span>
      </div>
      <OrderLines order={order} prices />
      <dl className="cafe-receipt-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{money(order.subtotalSen)}</dd>
        </div>
        <div>
          <dt>Discount ({order.payment.discountPct}%)</dt>
          <dd>−{money(order.payment.discountSen)}</dd>
        </div>
        <div className="cafe-receipt-payable">
          <dt>Total</dt>
          <dd>{money(order.payment.totalSen)}</dd>
        </div>
        <div>
          <dt>Payment method</dt>
          <dd>{order.payment.method} · simulated</dd>
        </div>
        <div>
          <dt>Tendered</dt>
          <dd>{money(order.payment.tenderSen)}</dd>
        </div>
        <div>
          <dt>Change</dt>
          <dd>{money(order.payment.changeSen)}</dd>
        </div>
      </dl>
      {order.refunded && (
        <p className="cafe-refunded">
          FULLY REFUNDED · {money(order.refund?.amountSen)}
        </p>
      )}
      <p className="cafe-receipt-thanks">
        Thanks for trying Saji Café.
        <br />
        This is a sample receipt, not a tax invoice.
      </p>
    </section>
  );
}

function Cashier({ view, workspace }: ViewProps) {
  const [selected, setSelected] = useState(""),
    [opening, setOpening] = useState("100.00"),
    [method, setMethod] = useState("Cash"),
    [discount, setDiscount] = useState("0"),
    [tender, setTender] = useState("20.00"),
    [fail, setFail] = useState(false),
    [restock, setRestock] = useState(false);
  const disabled = workspace.busy || workspace.needsRefresh;
  const manager = workspace.packet?.role === "manager";
  const orders = [...view.orders].reverse();
  const order =
    orders.find((item) => item.id === selected) ??
    orders.find((item) => !item.paid && item.status !== "Cancelled") ??
    orders[0];
  const active = view.shifts?.find(
    (shift) => shift.id === view.activeShiftId && !shift.closedAt,
  );
  const { totalSen: due } = quotePayment(
    order?.subtotalSen ?? 0,
    Number(discount),
  );
  const canRestock =
    order?.status === "Received" &&
    order.lines.every(
      (line) => view.menu.find((item) => item.id === line.itemId)?.restockable,
    );
  useEffect(() => {
    setSelected("");
    setRestock(false);
    setFail(false);
  }, [workspace.packet?.generation, workspace.packet?.workspaceId]);
  useEffect(() => {
    setRestock(false);
    setFail(false);
  }, [order?.id]);
  async function pay() {
    if (!order) return;
    const result = await workspace.act(
      "payment.settle",
      {
        id: order.id,
        method,
        discountPct: Number(discount),
        tenderSen: method === "Cash" ? sen(tender) : 0,
        simulateFailure: fail,
      },
      `Order ${order.number} settled. Stock and sales updated.`,
    );
    if (result) setSelected(order.id);
  }
  return (
    <section>
      <div className="cafe-shift">
        <div>
          <span className="cafe-overline">Cashier session</span>
          <h2>
            {active ? "Your shift is open" : "Open a shift to take payments"}
          </h2>
          <p>
            {active
              ? `Opened ${time(active.openedAt)} · Expected cash ${money(view.totals?.cashExpectedSen)}`
              : "Use a fictional opening cash float. Every payment here is simulated."}
          </p>
        </div>
        {active ? (
          <Button
            variant="secondary"
            disabled={disabled}
            onClick={() =>
              void workspace.act(
                "shift.close",
                {},
                "Shift closed with its expected cash balance.",
              )
            }
          >
            Close shift
          </Button>
        ) : (
          <form
            className="cafe-open-shift"
            onSubmit={(event) => {
              event.preventDefault();
              void workspace.act(
                "shift.open",
                { openingSen: sen(opening) },
                "Cashier shift opened.",
              );
            }}
          >
            <Field
              id="cafe-opening"
              label="Opening cash (RM)"
              type="number"
              min="0"
              max="10000"
              step="0.01"
              required
              value={opening}
              onChange={(event) => setOpening(event.target.value)}
            />
            <Button type="submit" disabled={disabled}>
              Open shift
            </Button>
          </form>
        )}
      </div>
      <div className="cafe-cashier-grid">
        <Card className="cafe-order-list">
          <div className="cafe-panel-heading">
            <h2>Orders</h2>
            <span className="cafe-count">{orders.length}</span>
          </div>
          <p>Select an order to settle or reprint.</p>
          {orders.length ? (
            <div className="cafe-order-selectors">
              {orders.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={order?.id === item.id ? "selected" : ""}
                  aria-pressed={order?.id === item.id}
                  onClick={() => setSelected(item.id)}
                >
                  <span>
                    <strong>Order {item.number}</strong>
                    <small>
                      Table {item.table} · {time(item.createdAt)}
                    </small>
                  </span>
                  <span>
                    <strong>
                      {money(item.payment?.totalSen ?? item.subtotalSen)}
                    </strong>
                    <small>
                      {item.refunded
                        ? "Refunded"
                        : item.paid
                          ? "Paid"
                          : item.status === "Cancelled"
                            ? "Cancelled"
                            : "Unpaid"}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Empty heading="No orders to settle">
              Place an order from Table menu to begin.
            </Empty>
          )}
        </Card>
        {order ? (
          <Card className="cafe-order-detail">
            <div className="cafe-detail-summary">
              <div className="cafe-ticket-heading">
                <div>
                  <span className="cafe-overline">Table {order.table}</span>
                  <h2>Order {order.number}</h2>
                </div>
                <OrderStatus order={order} />
              </div>
              <OrderLines order={order} prices />
            </div>
            {!order.paid && order.status !== "Cancelled" ? (
              <form
                className="cafe-tender"
                onSubmit={(event) => {
                  event.preventDefault();
                  void pay();
                }}
              >
                <div className="cafe-field-pair">
                  <div className="field">
                    <label htmlFor="cafe-method">Demo payment method</label>
                    <select
                      id="cafe-method"
                      value={method}
                      disabled={disabled}
                      onChange={(event) => setMethod(event.target.value)}
                    >
                      <option>Cash</option>
                      <option>Card</option>
                      <option>QR</option>
                    </select>
                  </div>
                  <Field
                    id="cafe-discount"
                    label="Discount (%)"
                    type="number"
                    min="0"
                    max={manager ? 30 : 10}
                    step="1"
                    required
                    value={discount}
                    disabled={disabled}
                    onChange={(event) => setDiscount(event.target.value)}
                  />
                </div>
                {method === "Cash" && (
                  <Field
                    id="cafe-tendered"
                    label="Cash tendered (RM)"
                    type="number"
                    min="0"
                    step="0.01"
                    max="100000"
                    required
                    value={tender}
                    disabled={disabled}
                    onChange={(event) => setTender(event.target.value)}
                  />
                )}
                <div className="cafe-total">
                  <span>Amount due</span>
                  <strong data-testid="cafe-amount-due">{money(due)}</strong>
                </div>
                {method === "Cash" && (
                  <p className="cafe-change">
                    Change preview{" "}
                    <strong>{money(Math.max(0, sen(tender) - due))}</strong>
                  </p>
                )}
                <label className="cafe-checkbox">
                  <input
                    type="checkbox"
                    checked={fail}
                    disabled={disabled}
                    onChange={(event) => setFail(event.target.checked)}
                  />
                  Simulate a declined payment
                </label>
                <Button type="submit" disabled={disabled || !active}>
                  Settle demo payment
                </Button>
                {!active && (
                  <p className="cafe-fine-print">
                    Open a shift above before settling this order.
                  </p>
                )}
                {order.status === "Received" && (
                  <Button
                    variant="secondary"
                    disabled={disabled}
                    onClick={() =>
                      void workspace.act(
                        "order.cancel",
                        { id: order.id },
                        "Unpaid order cancelled; reservations released.",
                      )
                    }
                  >
                    Cancel unpaid order
                  </Button>
                )}
              </form>
            ) : order.paid ? (
              <>
                <Receipt order={order} />
                <div className="cafe-receipt-actions">
                  <Button variant="secondary" onClick={() => window.print()}>
                    Print receipt
                  </Button>
                  <p>
                    Printer simulation uses this browser’s print preview.
                    Reprinting never charges again.
                  </p>
                  {manager && !order.refunded && (
                    <div className="cafe-refund-controls">
                      <h3>Full refund</h3>
                      <p>
                        Reverse this simulated payment once. Prepared items are
                        never restocked.
                      </p>
                      <label className="cafe-checkbox">
                        <input
                          type="checkbox"
                          checked={restock && !!canRestock}
                          disabled={disabled || !canRestock}
                          onChange={(event) => setRestock(event.target.checked)}
                        />
                        Restock eligible sealed items
                      </label>
                      <Button
                        variant="secondary"
                        disabled={disabled || !active}
                        onClick={() =>
                          void workspace.act(
                            "refund.full",
                            { id: order.id, restock: restock && !!canRestock },
                            "Full refund recorded. Sales and cash balances updated.",
                          )
                        }
                      >
                        Refund full payment
                      </Button>
                      {!active && <p>Open a shift to record the refund.</p>}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Empty heading="This order was cancelled">
                No payment can be taken for a cancelled order.
              </Empty>
            )}
          </Card>
        ) : (
          <Card className="cafe-order-detail">
            <Empty heading="Your counter is ready">
              Accepted table orders appear here with their kitchen status.
            </Empty>
          </Card>
        )}
      </div>
    </section>
  );
}

function Inventory({ view, workspace }: ViewProps) {
  const [drafts, setDrafts] = useState<
    Record<string, { stock: string; note: string }>
  >({});
  useEffect(() => {
    setDrafts({});
  }, [workspace.packet?.generation, workspace.packet?.workspaceId]);
  const disabled = workspace.busy || workspace.needsRefresh;
  return (
    <section>
      <div className="cafe-section-heading">
        <div>
          <span className="cafe-overline">Sellable units</span>
          <h2>Stock that stays in sync.</h2>
          <p>
            Available = on hand − reserved. Orders reserve stock; successful
            settlement deducts it.
          </p>
        </div>
      </div>
      <div className="cafe-inventory-grid">
        {view.menu.map((item) => {
          const draft = drafts[item.id] ?? {
            stock: String(item.onHand),
            note: "Sample stock count",
          };
          const update = (patch: Partial<typeof draft>) =>
            setDrafts((current) => ({
              ...current,
              [item.id]: { ...draft, ...patch },
            }));
          return (
            <Card key={item.id} className="cafe-inventory-item">
              <div>
                <span className="cafe-overline">{item.category}</span>
                <h3>{item.name}</h3>
                <p>{item.variant}</p>
              </div>
              <dl className="cafe-stock-counts">
                <div>
                  <dt>On hand</dt>
                  <dd data-testid={`stock-${item.id}`}>{item.onHand}</dd>
                </div>
                <div>
                  <dt>Reserved</dt>
                  <dd>{item.reserved}</dd>
                </div>
                <div>
                  <dt>Available</dt>
                  <dd>{item.onHand - item.reserved}</dd>
                </div>
              </dl>
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  const result = await workspace.act(
                    "inventory.adjust",
                    {
                      itemId: item.id,
                      onHand: Number(draft.stock),
                      note: draft.note,
                    },
                    `${item.name} stock updated with an audit record.`,
                  );
                  if (result)
                    setDrafts((current) => {
                      const next = { ...current };
                      delete next[item.id];
                      return next;
                    });
                }}
              >
                <Field
                  id={`stock-input-${item.id}`}
                  label={`New on-hand stock · ${title(item)}`}
                  type="number"
                  min={item.reserved}
                  max="10000"
                  step="1"
                  required
                  value={draft.stock}
                  disabled={disabled}
                  onChange={(event) => update({ stock: event.target.value })}
                />
                <Field
                  id={`stock-note-${item.id}`}
                  label={`Adjustment note · ${title(item)}`}
                  required
                  maxLength={120}
                  value={draft.note}
                  disabled={disabled}
                  onChange={(event) => update({ note: event.target.value })}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={disabled}
                  aria-label={`Update stock for ${item.name} ${item.variant}`}
                >
                  Update stock
                </Button>
              </form>
            </Card>
          );
        })}
      </div>
      <div className="cafe-section-heading cafe-movement-heading">
        <div>
          <h2>Inventory movements</h2>
          <p>
            Latest stock effects, including sales, waste and manager
            adjustments.
          </p>
        </div>
      </div>
      {view.movements?.length ? (
        <div
          className="cafe-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Inventory movement history"
        >
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Item</th>
                <th>Movement</th>
                <th>Quantity</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {[...view.movements].reverse().map((move) => (
                <tr key={move.id}>
                  <td>{time(move.at)}</td>
                  <td>
                    {view.menu.find((item) => item.id === move.itemId)?.name}
                  </td>
                  <td>{move.kind}</td>
                  <td>
                    {move.qty > 0 ? "+" : ""}
                    {move.qty}
                  </td>
                  <td>{move.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty heading="No movements yet">
          Stock changes will be recorded here as you use the demo.
        </Empty>
      )}
    </section>
  );
}

function Reports({ view }: { view: CafeView }) {
  const totals = view.totals;
  if (!totals) return null;
  const settled = view.orders.filter((order) => order.paid);
  const metrics = [
    ["Gross sales", totals.grossSen],
    ["Discounts", totals.discountSen],
    ["Refunds", totals.refundSen],
    ["Net sales", totals.netSen],
  ] as const;
  return (
    <section>
      <div className="cafe-section-heading">
        <div>
          <span className="cafe-overline">Sales overview</span>
          <h2>A clear view of this workspace.</h2>
          <p>
            Totals reflect settled demo payments. Unpaid and cancelled orders
            are excluded.
          </p>
        </div>
      </div>
      <dl className="cafe-report-metrics">
        {metrics.map(([label, value]) => (
          <div key={label} className={label === "Net sales" ? "featured" : ""}>
            <dt>{label}</dt>
            <dd data-testid={`report-${label.toLowerCase().replace(" ", "-")}`}>
              {money(value)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="cafe-report-context">
        <span>
          <strong>{totals.paidOrders}</strong> settled orders
        </span>
        {view.shifts && (
          <span>
            Current shift expected cash{" "}
            <strong>{money(totals.cashExpectedSen)}</strong>
          </span>
        )}
      </div>
      {settled.length ? (
        <div
          className="cafe-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Cafe transaction history"
        >
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Table</th>
                <th>Method</th>
                <th>Paid total</th>
                <th>Refund</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...settled].reverse().map((order) => (
                <tr key={order.id}>
                  <td>Order {order.number}</td>
                  <td>{order.table}</td>
                  <td>{order.payment?.method}</td>
                  <td>{money(order.payment?.totalSen)}</td>
                  <td>{money(order.refund?.amountSen)}</td>
                  <td>{order.refunded ? "Refunded" : "Paid"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          heading={totals.paidOrders ? "Summary view" : "No settled sales yet"}
        >
          {totals.paidOrders
            ? "Viewer mode shows summary totals without individual order details."
            : "Settle a demo order at the cashier to see the sales totals update."}
        </Empty>
      )}
      {view.shifts && view.shifts.length > 0 && (
        <>
          <div className="cafe-section-heading cafe-movement-heading">
            <h2>Shift history</h2>
          </div>
          <div
            className="cafe-table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Cashier shift history"
          >
            <table>
              <thead>
                <tr>
                  <th>Opened</th>
                  <th>Opening cash</th>
                  <th>Closed</th>
                  <th>Closing cash</th>
                </tr>
              </thead>
              <tbody>
                {[...view.shifts].reverse().map((shift) => (
                  <tr key={shift.id}>
                    <td>{time(shift.openedAt)}</td>
                    <td>{money(shift.openingSen)}</td>
                    <td>{shift.closedAt ? time(shift.closedAt) : "Open"}</td>
                    <td>
                      {shift.closedCashSen === null
                        ? "—"
                        : money(shift.closedCashSen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="cafe-fine-print cafe-report-note">
        Fictional sales demonstration only. This report is not accounting, tax
        or regulatory advice.
      </p>
    </section>
  );
}

export function CafeWorkspace() {
  const workspace = useLabWorkspace("cafe-pos");
  const view = workspace.packet?.state as CafeView | undefined;
  const role = workspace.packet?.role ?? "customer";
  const allowed: Area[] =
    role === "customer"
      ? ["menu"]
      : role === "kitchen"
        ? ["kitchen"]
        : role === "cashier"
          ? ["cashier", "menu", "reports"]
          : role === "manager"
            ? ["cashier", "menu", "kitchen", "inventory", "reports"]
            : ["reports"];
  const [area, setArea] = useState<Area>("menu");
  useEffect(() => {
    setArea(
      role === "customer"
        ? "menu"
        : role === "kitchen"
          ? "kitchen"
          : role === "viewer"
            ? "reports"
            : "cashier",
    );
  }, [role]);
  const current = allowed.includes(area) ? area : allowed[0];
  return (
    <LabShell
      title="Saji Café"
      category="Café POS & QR ordering"
      description="One connected café. Order at the table, prepare in the kitchen and settle at the counter."
      workspace={workspace}
    >
      {view && (
        <div className="cafe-app">
          <nav className="cafe-nav" aria-label="Cafe work areas">
            {allowed.map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={current === value}
                onClick={() => setArea(value)}
              >
                {labels[value]}
                {value === "kitchen" && (
                  <span>
                    {
                      view.orders.filter(
                        (order) =>
                          !order.refunded &&
                          !["Cancelled", "Served"].includes(order.status),
                      ).length
                    }
                  </span>
                )}
              </button>
            ))}
          </nav>
          {current === "menu" && (
            <TableMenu view={view} workspace={workspace} />
          )}
          {current === "kitchen" && (
            <Kitchen view={view} workspace={workspace} />
          )}
          {current === "cashier" && (
            <Cashier view={view} workspace={workspace} />
          )}
          {current === "inventory" && (
            <Inventory view={view} workspace={workspace} />
          )}
          {current === "reports" && <Reports view={view} />}
        </div>
      )}
    </LabShell>
  );
}
