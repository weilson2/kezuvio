"use client";
import { Button, Icon } from "@kezuvio/ui";
import {
  cartTotal,
  money,
  type DemoState,
  type CartKind,
  type Product,
  type Sale,
} from "@/lib/demo/engine";
export type DemoProps = {
  state: DemoState;
  busy: boolean;
  act: (
    action: string,
    args?: Record<string, unknown>,
    message?: string,
  ) => Promise<DemoState | null>;
};
export function Select({
  label,
  id,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
    </div>
  );
}
export function Stats({
  items,
}: {
  items: { label: string; value: string | number; detail?: string }[];
}) {
  return (
    <div className="demo-stats">
      {items.map((i) => (
        <div key={i.label}>
          <span>{i.label}</span>
          <strong>{i.value}</strong>
          {i.detail && <small>{i.detail}</small>}
        </div>
      ))}
    </div>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="demo-empty">
      <Icon name="layers" />
      <p>{children}</p>
    </div>
  );
}
export function Cart({
  kind,
  state,
  act,
  busy,
  children,
}: { kind: CartKind; children?: React.ReactNode } & DemoProps) {
  const lines = state.carts[kind];
  return (
    <aside className="demo-panel cart-panel">
      <div className="panel-heading">
        <h2>Your cart</h2>
        <span className="badge">
          {lines.reduce((n, l) => n + l.qty, 0)} items
        </span>
      </div>
      {!lines.length ? (
        <Empty>Add something to get started.</Empty>
      ) : (
        <div className="cart-lines">
          {lines.map((l) => (
            <div className="cart-line" key={l.key}>
              <div>
                <strong>{l.name}</strong>
                <small>
                  {l.variant} · {money(l.price)} each
                </small>
              </div>
              <div className="cart-line-bottom">
                <div className="quantity-control">
                  <button
                    aria-label={`Decrease ${l.name} ${l.variant}`}
                    disabled={busy}
                    onClick={() =>
                      act("cart.quantity", { kind, key: l.key, qty: l.qty - 1 })
                    }
                  >
                    −
                  </button>
                  <span aria-label={`Quantity ${l.qty}`}>{l.qty}</span>
                  <button
                    aria-label={`Increase ${l.name} ${l.variant}`}
                    disabled={busy || l.qty >= 99}
                    onClick={() =>
                      act("cart.quantity", { kind, key: l.key, qty: l.qty + 1 })
                    }
                  >
                    +
                  </button>
                </div>
                <strong>{money(l.price * l.qty)}</strong>
                <button
                  className="remove-item"
                  disabled={busy}
                  onClick={() =>
                    act("cart.quantity", { kind, key: l.key, qty: 0 })
                  }
                  aria-label={`Remove ${l.name} ${l.variant}`}
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="cart-total">
        <span>Subtotal</span>
        <strong>{money(cartTotal(lines))}</strong>
      </div>
      {children}
      <p className="field-help">
        Sample prices in RM. No tax, delivery fee or real payment is applied.
      </p>
    </aside>
  );
}
export function ProductTile({
  product,
  children,
}: {
  product: Product;
  children: React.ReactNode;
}) {
  return (
    <article className="demo-product">
      <div
        className={`product-symbol symbol-${product.category.replaceAll(" ", "-").toLowerCase()}`}
        aria-hidden="true"
      >
        {product.symbol}
      </div>
      <div className="product-tile-copy">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-price">
          <strong>{money(product.price)}</strong>
          <small>{product.stock} available</small>
        </div>
        {children}
      </div>
    </article>
  );
}
export function Receipt({ sale }: { sale: Sale }) {
  return (
    <section className="demo-panel receipt-panel">
      <div className="panel-heading">
        <h2>Receipt preview</h2>
        <Button variant="secondary" onClick={() => window.print()}>
          Print receipt
        </Button>
      </div>
      <div id="demo-print">
        <span className="demo-pill">DEMO MODE · NOT A TAX INVOICE</span>
        <h3>Kedai {sale.kind === "pos" ? "Counter" : "Everyday"}</h3>
        <p>Fictional store · {sale.id}</p>
        <div className="receipt-lines">
          {sale.lines.map((l) => (
            <div key={l.key}>
              <span>
                {l.qty} × {l.name}
              </span>
              <span>{money(l.price * l.qty)}</span>
            </div>
          ))}
        </div>
        <div className="receipt-lines">
          <div>
            <span>Subtotal</span>
            <span>{money(sale.subtotal)}</span>
          </div>
          <div>
            <span>Discount</span>
            <span>−{money(sale.discount)}</span>
          </div>
          <div>
            <strong>Total</strong>
            <strong>{money(sale.total)}</strong>
          </div>
          <div>
            <span>Simulated {sale.method}</span>
            <span>{money(sale.tender)}</span>
          </div>
          <div>
            <span>Change</span>
            <span>{money(sale.change)}</span>
          </div>
        </div>
        <p>
          {sale.refunded
            ? "REFUNDED · Stock restored"
            : "No money was charged."}
        </p>
        <small>
          Browser printing only. Physical printers and offline sync are
          unverified.
        </small>
      </div>
    </section>
  );
}
export function RoleNote({ state }: { state: DemoState }) {
  return (
    <p className="field-help">
      Selected demo role: <strong>{state.role}</strong>. Manager can edit
      financial records and issue refunds; staff can sell and manage orders;
      viewer can inspect. This is a role simulation inside your own sample
      workspace.
    </p>
  );
}
