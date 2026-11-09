"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, Icon, TextArea } from "@kezuvio/ui";
import { Empty, ProductTile, Select, Stats } from "../demos/shared";
import { money } from "@/lib/demo/engine";
import type {
  CommerceProduct,
  CommerceView,
} from "../../../../packages/commerce/index";
import {
  parsePriceSen,
  quoteCommerce,
} from "../../../../packages/commerce/pricing";
import { LabShell, useLabWorkspace, type LabWorkspace } from "./platform-shell";
import "./commerce.css";

type ViewProps = { view: CommerceView; workspace: LabWorkspace };
type Area =
  "shop" | "history" | "dashboard" | "products" | "inventory" | "orders";
type Order = CommerceView["orders"][number];
const labels: Record<Area, string> = {
  shop: "Shop catalogue",
  history: "My orders",
  dashboard: "Seller dashboard",
  products: "Products",
  inventory: "Inventory",
  orders: "Orders",
};
const date = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value));

function Shop({
  view,
  workspace,
  onCheckout,
}: ViewProps & { onCheckout: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [code, setCode] = useState("");
  const [method, setMethod] = useState("Card");
  const [decline, setDecline] = useState(false);
  const disabled = workspace.busy || workspace.needsRefresh;
  const categories = [
    "All",
    ...new Set(view.products.map((product) => product.category)),
  ];
  const products = view.products.filter(
    (product) =>
      (category === "All" || product.category === category) &&
      `${product.name} ${product.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const quote = quoteCommerce(view.cart.subtotalSen, code);
  const change = (productId: string, qty: number) =>
    workspace.act(
      "cart.set",
      { productId, qty, version: view.cart.version },
      "Cart saved.",
    );
  async function checkout(event: FormEvent) {
    event.preventDefault();
    const result = await workspace.act(
      "checkout",
      {
        cartVersion: view.cart.version,
        catalogVersion: view.catalogVersion,
        code,
        method,
        decline,
      },
      "Mock checkout complete. No money was charged.",
    );
    if (result) onCheckout();
  }
  return (
    <>
      <div className="commerce-heading">
        <div>
          <span className="eyebrow">Kedai / Everyday essentials</span>
          <h2>Small things. Thoughtfully chosen.</h2>
          <p>
            The familiar Kedai collection, with its own saved shop workspace.
          </p>
        </div>
        <Field
          id="commerce-search"
          label="Search products"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try notebook…"
        />
      </div>
      <div className="filter-row" role="group" aria-label="Product categories">
        {categories.map((item) => (
          <button
            key={item}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="commerce-shop-layout">
        <div>
          {products.length ? (
            <div className="demo-product-grid">
              {products.map((product) => {
                const qty =
                  view.cart.lines.find((line) => line.productId === product.id)
                    ?.qty || 0;
                return (
                  <ProductTile
                    key={product.id}
                    product={{
                      ...product,
                      price: product.priceSen,
                      stock: product.onHand,
                    }}
                  >
                    <details className="product-details">
                      <summary>Product details</summary>
                      <p>
                        {product.description} Demonstration item only; nothing
                        is shipped. Item code: {product.id.toUpperCase()}.
                      </p>
                    </details>
                    <Button
                      disabled={disabled || product.onHand <= qty || qty >= 99}
                      onClick={() => void change(product.id, qty + 1)}
                    >
                      {product.onHand === 0
                        ? `Sold out: ${product.name}`
                        : `Add ${product.name}`}
                    </Button>
                  </ProductTile>
                );
              })}
            </div>
          ) : (
            <Empty>
              No products match your search. Try another category or term.
            </Empty>
          )}
        </div>
        <aside className="demo-panel commerce-cart" aria-label="Shopping cart">
          <div className="panel-heading">
            <h2>Your cart</h2>
            <span className="badge">
              {view.cart.lines.reduce((sum, line) => sum + line.qty, 0)} items
            </span>
          </div>
          {view.cart.lines.length ? (
            <ul className="commerce-cart-lines">
              {view.cart.lines.map((line) => {
                const product = view.products.find(
                  (item) => item.id === line.productId,
                );
                const unavailable = !product || product.onHand < line.qty;
                return (
                  <li key={line.productId}>
                    <div>
                      <strong>{line.name}</strong>
                      <small>{money(line.unitPriceSen)} each</small>
                      {unavailable && (
                        <small className="commerce-stock-warning">
                          Unavailable quantity. Reduce or remove this item.
                        </small>
                      )}
                    </div>
                    <div className="commerce-quantity">
                      <button
                        disabled={disabled}
                        aria-label={`Decrease ${line.name}`}
                        onClick={() =>
                          void change(line.productId, line.qty - 1)
                        }
                      >
                        −
                      </button>
                      <span aria-label={`Quantity of ${line.name}`}>
                        {line.qty}
                      </span>
                      <button
                        disabled={
                          disabled ||
                          !product ||
                          line.qty >= product.onHand ||
                          line.qty >= 99
                        }
                        aria-label={`Increase ${line.name}`}
                        onClick={() =>
                          void change(line.productId, line.qty + 1)
                        }
                      >
                        +
                      </button>
                      <button
                        disabled={disabled}
                        aria-label={`Remove ${line.name}`}
                        onClick={() => void change(line.productId, 0)}
                      >
                        <Icon name="close" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>
              Add something to get started. Your cart is saved as you shop.
            </Empty>
          )}
          {!!view.cart.lines.length && (
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() =>
                void workspace.act(
                  "cart.clear",
                  { version: view.cart.version },
                  "Cart cleared.",
                )
              }
            >
              Clear cart
            </Button>
          )}
          <form className="commerce-checkout" onSubmit={checkout}>
            <Field
              id="commerce-coupon"
              label="Sample discount code"
              value={code}
              maxLength={20}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="EVOLVE10"
              help="Try EVOLVE10 for 10% off. No tax or delivery fees."
            />
            <Select
              id="commerce-method"
              label="Simulated payment"
              value={method}
              onChange={setMethod}
              disabled={disabled}
            >
              <option>Card</option>
              <option>QR</option>
            </Select>
            <label className="commerce-checkbox">
              <input
                type="checkbox"
                checked={decline}
                onChange={(event) => setDecline(event.target.checked)}
                disabled={disabled}
              />
              Simulate a declined payment
            </label>
            <dl className="commerce-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{money(view.cart.subtotalSen)}</dd>
              </div>
              <div>
                <dt>Discount preview</dt>
                <dd>−{money(quote.discountSen)}</dd>
              </div>
              <div className="commerce-payable">
                <dt>Total</dt>
                <dd data-testid="commerce-cart-total">
                  {money(quote.totalSen)}
                </dd>
              </div>
            </dl>
            <Button
              type="submit"
              disabled={disabled || !view.cart.lines.length}
            >
              Simulate checkout
            </Button>
            <p className="field-help">
              Checkout as Sample Guest. No card or address details are
              collected. Stock is checked when you submit.
            </p>
          </form>
        </aside>
      </div>
    </>
  );
}

function OrderCard({
  order,
  workspace,
  seller,
}: {
  order: Order;
  workspace: LabWorkspace;
  seller: boolean;
}) {
  const [restock, setRestock] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const disabled = workspace.busy || workspace.needsRefresh;
  const next =
    order.status === "Paid"
      ? "Packed"
      : order.status === "Packed"
        ? "Shipped"
        : order.status === "Shipped"
          ? "Delivered"
          : null;
  const nextLabel =
    next === "Packed"
      ? "Pack order"
      : next === "Shipped"
        ? "Ship order"
        : "Mark delivered";
  const restockAllowed = order.status === "Paid" || order.status === "Packed";
  async function refund() {
    const result = await workspace.act(
      "refund.full",
      { id: order.id, restock: restockAllowed && restock },
      "Full mock refund recorded.",
    );
    if (result) setConfirmRefund(false);
  }
  return (
    <section
      className="demo-panel commerce-order"
      aria-label={`Order ${order.number}`}
    >
      <div className="commerce-order-heading">
        <div>
          <h3>Order {order.number}</h3>
          <small>{date(order.createdAt)} · MYT</small>
        </div>
        <span className="badge">
          {order.refund ? "Refunded" : order.status}
        </span>
      </div>
      <ol className="commerce-order-progress" aria-label="Order progress">
        {["Paid", "Packed", "Shipped", "Delivered"].map((status) => (
          <li
            key={status}
            aria-current={
              !order.refund && order.status === status ? "step" : undefined
            }
          >
            {status}
          </li>
        ))}
      </ol>
      <ul className="commerce-order-lines">
        {order.lines.map((line) => (
          <li key={line.productId}>
            <span>
              {line.qty} × {line.name}
            </span>
            <strong>{money(line.unitPriceSen * line.qty)}</strong>
          </li>
        ))}
      </ul>
      <dl className="commerce-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{money(order.subtotalSen)}</dd>
        </div>
        <div>
          <dt>Discount{order.code ? ` · ${order.code}` : ""}</dt>
          <dd>−{money(order.discountSen)}</dd>
        </div>
        <div className="commerce-payable">
          <dt>Mock payment · {order.method}</dt>
          <dd>{money(order.totalSen)}</dd>
        </div>
        {order.refund && (
          <div>
            <dt>Full mock refund</dt>
            <dd>{money(order.refund.amountSen)}</dd>
          </div>
        )}
      </dl>
      {order.refund && (
        <p className="notice">
          {order.refund.restock
            ? "Items returned to sample stock."
            : "Stock was not returned."}{" "}
          Refunded {date(order.refund.at)} MYT.
        </p>
      )}
      {seller && !order.refund && (
        <div className="commerce-order-actions">
          {next && (
            <Button
              disabled={disabled}
              onClick={() =>
                void workspace.act(
                  "order.advance",
                  { id: order.id, status: next },
                  `Order marked ${next.toLowerCase()}.`,
                )
              }
            >
              {nextLabel}
            </Button>
          )}
          {!confirmRefund ? (
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() => setConfirmRefund(true)}
            >
              Refund order
            </Button>
          ) : (
            <div
              className="commerce-refund"
              role="group"
              aria-label={`Refund order ${order.number}`}
            >
              <strong>Refund {money(order.totalSen)} in full?</strong>
              {restockAllowed ? (
                <label className="commerce-checkbox">
                  <input
                    type="checkbox"
                    checked={restock}
                    onChange={(event) => setRestock(event.target.checked)}
                    disabled={disabled}
                  />
                  Restock unshipped items
                </label>
              ) : (
                <p>
                  Shipped or delivered items cannot return to stock in this
                  demo.
                </p>
              )}
              <div className="button-row">
                <Button disabled={disabled} onClick={() => void refund()}>
                  Issue full mock refund
                </Button>
                <Button
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => setConfirmRefund(false)}
                >
                  Keep order
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Orders({ view, workspace, seller }: ViewProps & { seller: boolean }) {
  const [filter, setFilter] = useState("All");
  const orders = view.orders.filter(
    (order) =>
      filter === "All" ||
      (filter === "Refunded"
        ? !!order.refund
        : !order.refund && order.status === filter),
  );
  return (
    <>
      <div className="commerce-heading">
        <div>
          <span className="eyebrow">
            {seller ? "Seller / Fulfilment" : "Your saved purchases"}
          </span>
          <h2>{seller ? "From paid to delivered." : "Your sample orders"}</h2>
          <p>
            {seller
              ? "Advance each order and see stock and sales stay in step."
              : "Follow your fictional purchases here. Nothing is charged or shipped."}
          </p>
        </div>
        <Select
          id="commerce-order-filter"
          label="Filter orders"
          value={filter}
          onChange={setFilter}
        >
          {["All", "Paid", "Packed", "Shipped", "Delivered", "Refunded"].map(
            (status) => (
              <option key={status}>{status}</option>
            ),
          )}
        </Select>
      </div>
      {orders.length ? (
        <div className="commerce-order-grid">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              workspace={workspace}
              seller={seller}
            />
          ))}
        </div>
      ) : (
        <Empty>
          {filter === "All"
            ? "No orders yet. Complete a mock checkout as Customer to start this story."
            : "No orders match this status."}
        </Empty>
      )}
    </>
  );
}

function ProductForm({
  product,
  workspace,
  onSaved,
  onCancel,
}: {
  product?: CommerceProduct;
  workspace: LabWorkspace;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || "Stationery");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(
    product ? (product.priceSen / 100).toFixed(2) : "18.00",
  );
  const [stock, setStock] = useState("10");
  const [error, setError] = useState("");
  const disabled = workspace.busy || workspace.needsRefresh;
  const prefix = product ? "commerce-edit" : "commerce-create";
  async function submit(event: FormEvent) {
    event.preventDefault();
    let priceSen: number;
    try {
      priceSen = parsePriceSen(price);
    } catch {
      setError("Enter a valid price with no more than two decimal places.");
      return;
    }
    setError("");
    const args = {
      name,
      category,
      description,
      priceSen,
      ...(product ? { id: product.id } : { onHand: Number(stock) }),
    };
    const result = await workspace.act(
      product ? "product.update" : "product.create",
      args,
      product ? "Product saved." : "Product added to your shop.",
    );
    if (result) onSaved();
  }
  return (
    <form
      className="demo-panel commerce-product-form"
      aria-label={product ? "Edit product" : "Add product"}
      onSubmit={submit}
    >
      <h3>{product ? `Edit ${product.name}` : "Add a product"}</h3>
      <p>Use fictional product information and sample prices in RM.</p>
      <Field
        id={`${prefix}-name`}
        label="Product name"
        value={name}
        maxLength={80}
        required
        onChange={(event) => setName(event.target.value)}
      />
      <Field
        id={`${prefix}-category`}
        label="Category"
        value={category}
        maxLength={40}
        required
        onChange={(event) => setCategory(event.target.value)}
      />
      <TextArea
        id={`${prefix}-description`}
        label="Description"
        value={description}
        maxLength={300}
        required
        rows={3}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className="commerce-field-pair">
        <Field
          id={`${prefix}-price`}
          label="Price (RM)"
          type="number"
          value={price}
          min="0.01"
          max="10000"
          step="0.01"
          required
          onChange={(event) => setPrice(event.target.value)}
        />
        {!product && (
          <Field
            id={`${prefix}-stock`}
            label="Opening stock"
            type="number"
            value={stock}
            min="0"
            max="10000"
            step="1"
            required
            onChange={(event) => setStock(event.target.value)}
          />
        )}
      </div>
      {error && (
        <p role="alert" className="commerce-stock-warning">
          {error}
        </p>
      )}
      <div className="button-row">
        <Button type="submit" disabled={disabled}>
          {product ? "Save product" : "Create product"}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel editing
          </Button>
        )}
      </div>
    </form>
  );
}

function Products({ view, workspace }: ViewProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [created, setCreated] = useState(0);
  const disabled = workspace.busy || workspace.needsRefresh;
  const selected = view.products.find((product) => product.id === editing);
  return (
    <>
      <div className="commerce-heading">
        <div>
          <span className="eyebrow">Seller / Collection</span>
          <h2>A catalogue you can make your own.</h2>
          <p>
            Create, edit or archive fictional goods. Existing orders keep the
            details agreed at checkout.
          </p>
        </div>
        <span className="badge">
          {view.products.filter((product) => product.active).length} active
          products
        </span>
      </div>
      <div className="commerce-management-layout">
        <div className="commerce-product-list">
          {view.products.map((product) => (
            <article
              className={`demo-panel commerce-product-row${product.active ? "" : " commerce-archived"}`}
              key={product.id}
            >
              <div className="commerce-product-mark" aria-hidden="true">
                {product.symbol}
              </div>
              <div>
                <span className="product-category">{product.category}</span>
                <h3>{product.name}</h3>
                <p>
                  {money(product.priceSen)} · {product.onHand} in stock ·{" "}
                  {product.active ? "Active" : "Archived"}
                </p>
              </div>
              <div className="button-row">
                <Button
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => setEditing(product.id)}
                  aria-label={`Edit ${product.name}`}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  disabled={disabled}
                  aria-label={`${product.active ? "Archive" : "Restore"} ${product.name}`}
                  onClick={() =>
                    void workspace.act(
                      "product.archive",
                      { id: product.id, active: !product.active },
                      product.active
                        ? "Product archived. Existing orders are preserved."
                        : "Product restored to the shop.",
                    )
                  }
                >
                  {product.active ? "Archive" : "Restore"}
                </Button>
              </div>
            </article>
          ))}
        </div>
        {selected ? (
          <ProductForm
            key={selected.id}
            product={selected}
            workspace={workspace}
            onSaved={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <ProductForm
            key={`new-${created}`}
            workspace={workspace}
            onSaved={() => setCreated((count) => count + 1)}
          />
        )}
      </div>
    </>
  );
}

function StockItem({
  product,
  workspace,
}: {
  product: CommerceProduct;
  workspace: LabWorkspace;
}) {
  const [delta, setDelta] = useState("1");
  const [note, setNote] = useState("");
  const disabled = workspace.busy || workspace.needsRefresh;
  async function adjust(event: FormEvent) {
    event.preventDefault();
    const result = await workspace.act(
      "inventory.adjust",
      { id: product.id, delta: Number(delta), note },
      "Stock adjustment saved.",
    );
    if (result) setNote("");
  }
  return (
    <section
      className="demo-panel commerce-stock-item"
      aria-label={`Stock for ${product.name}`}
    >
      <div>
        <span className="product-category">
          {product.category}
          {!product.active && " · Archived"}
        </span>
        <h3>{product.name}</h3>
      </div>
      <div className="commerce-stock-count">
        <span>On hand</span>
        <strong data-testid={`commerce-stock-${product.id}`}>
          {product.onHand}
        </strong>
        <small>
          {product.onHand <= 5 ? "Low stock" : "Available in this workspace"}
        </small>
      </div>
      <form onSubmit={adjust}>
        <Field
          id={`commerce-delta-${product.id}`}
          label="Stock change"
          type="number"
          min="-10000"
          max="10000"
          step="1"
          value={delta}
          required
          onChange={(event) => setDelta(event.target.value)}
          help="Use a positive number to add stock or a negative number to remove it."
        />
        <Field
          id={`commerce-note-${product.id}`}
          label="Adjustment note"
          value={note}
          maxLength={160}
          required
          onChange={(event) => setNote(event.target.value)}
          placeholder="Sample delivery arrived"
        />
        <Button type="submit" disabled={disabled}>
          Save stock adjustment
        </Button>
      </form>
    </section>
  );
}

function Inventory({ view, workspace }: ViewProps) {
  return (
    <>
      <div className="commerce-heading">
        <div>
          <span className="eyebrow">Seller / Inventory</span>
          <h2>Every movement has a reason.</h2>
          <p>
            Checkout consumes stock once. Cart items are not reserved. Record
            adjustments with a short note.
          </p>
        </div>
      </div>
      <div className="commerce-stock-grid">
        {view.products.map((product) => (
          <StockItem key={product.id} product={product} workspace={workspace} />
        ))}
      </div>
      <section
        className="demo-panel commerce-movements"
        aria-label="Stock movement history"
      >
        <h3>Stock movement history</h3>
        {view.movements?.length ? (
          <div
            className="table-wrap"
            role="region"
            aria-label="Scrollable stock movements"
            tabIndex={0}
          >
            <table>
              <caption className="sr-only">Saved stock movements</caption>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Movement</th>
                  <th>Quantity</th>
                  <th>Note</th>
                  <th>Time (MYT)</th>
                </tr>
              </thead>
              <tbody>
                {view.movements.map((movement) => (
                  <tr key={movement.id}>
                    <th scope="row">
                      {view.products.find(
                        (product) => product.id === movement.productId,
                      )?.name || movement.productId}
                    </th>
                    <td>{movement.kind}</td>
                    <td>
                      {movement.qty > 0 ? "+" : ""}
                      {movement.qty}
                    </td>
                    <td>{movement.note}</td>
                    <td>{date(movement.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>
            No stock movements yet. Try a checkout or stock adjustment.
          </Empty>
        )}
      </section>
    </>
  );
}

function Dashboard({ view }: { view: CommerceView }) {
  const totals = view.totals;
  if (!totals)
    return (
      <Empty>
        Choose Customer to shop or Manager to explore the seller tools.
      </Empty>
    );
  return (
    <>
      <div className="commerce-heading">
        <div>
          <span className="eyebrow">Seller / Overview</span>
          <h2>A clear view of your shop.</h2>
          <p>Live totals from this fictional Commerce workspace.</p>
        </div>
        <span className="commerce-live">
          <i />
          Saved locally · refreshes every 5 seconds
        </span>
      </div>
      <div className="commerce-featured-metrics">
        <div>
          <span>Net sales</span>
          <strong data-testid="commerce-net">{money(totals.netSen)}</strong>
          <small>After discounts and mock refunds</small>
        </div>
        <div>
          <span>Refunded</span>
          <strong data-testid="commerce-refunds">
            {money(totals.refundSen)}
          </strong>
          <small>Full mock refunds only</small>
        </div>
      </div>
      <Stats
        items={[
          { label: "Gross before discounts", value: money(totals.grossSen) },
          { label: "Discounts", value: money(totals.discountSen) },
          { label: "Checkouts", value: totals.paidOrders },
          { label: "Active orders", value: totals.activeOrders },
          { label: "Units sold", value: totals.unitsSold },
          { label: "Low-stock products", value: totals.lowStock },
        ]}
      />
      <section className="demo-panel commerce-dashboard-note">
        <h3>Follow a complete shop journey</h3>
        <p>
          Shop as Customer, then switch to Manager to pack, ship and deliver the
          same order. Add products, adjust stock or issue a full mock refund
          from the seller tools.
        </p>
        <p className="notice">
          Net sales = gross − discounts − refunds. No real payments, taxes,
          delivery fees or accounting compliance are represented. Manager is a
          selectable seller simulation.
        </p>
      </section>
    </>
  );
}

function CommerceContent({ view, workspace }: ViewProps) {
  const role = workspace.packet!.role;
  const areas: Area[] =
    role === "customer"
      ? ["shop", "history"]
      : role === "manager"
        ? ["dashboard", "products", "inventory", "orders"]
        : ["dashboard"];
  const [area, setArea] = useState<Area>(areas[0]);
  const selected = areas.includes(area) ? area : areas[0];
  return (
    <div className="commerce-app">
      <div
        className="demo-tablist commerce-nav"
        role="group"
        aria-label="Commerce views"
      >
        {areas.map((item) => (
          <Button
            key={item}
            variant={selected === item ? "primary" : "secondary"}
            aria-pressed={selected === item}
            onClick={() => setArea(item)}
          >
            {labels[item]}
          </Button>
        ))}
      </div>
      {role === "manager" && (
        <p className="commerce-role-note">
          Manager is the simulated seller for this shop. Switch to Customer to
          try the storefront.
        </p>
      )}
      {selected === "shop" && (
        <Shop
          view={view}
          workspace={workspace}
          onCheckout={() => setArea("history")}
        />
      )}
      {selected === "history" && (
        <Orders view={view} workspace={workspace} seller={false} />
      )}
      {selected === "orders" && (
        <Orders view={view} workspace={workspace} seller />
      )}
      {selected === "products" && (
        <Products view={view} workspace={workspace} />
      )}
      {selected === "inventory" && (
        <Inventory view={view} workspace={workspace} />
      )}
      {selected === "dashboard" && <Dashboard view={view} />}
    </div>
  );
}

export function CommerceWorkspace() {
  const workspace = useLabWorkspace("commerce-studio");
  const packet = workspace.packet;
  return (
    <LabShell
      title="Commerce Studio"
      category="Shop & seller workspace"
      description="Discover Kedai Everyday, then step behind the counter to manage products, stock and orders. Every purchase is fictional."
      workspace={workspace}
      roles={["customer", "manager", "viewer"]}
    >
      {packet && (
        <CommerceContent
          key={`${packet.workspaceId}:${packet.generation}:${packet.role}`}
          view={packet.state as CommerceView}
          workspace={workspace}
        />
      )}
    </LabShell>
  );
}
