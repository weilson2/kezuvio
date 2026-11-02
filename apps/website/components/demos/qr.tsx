"use client";
import { useState } from "react";
import { Button } from "@kezuvio/ui";
import { money } from "@/lib/demo/engine";
import {
  Cart,
  Empty,
  ProductTile,
  Select,
  Stats,
  type DemoProps,
} from "./shared";
export function QrDemo(props: DemoProps) {
  const { state, act, busy } = props;
  const [tab, setTab] = useState("customer"),
    [category, setCategory] = useState("All"),
    [table, setTable] = useState("1"),
    [options, setOptions] = useState<Record<string, string>>({});
  return (
    <>
      <div className="demo-tablist" role="group" aria-label="QR ordering views">
        <Button
          variant={tab === "customer" ? "primary" : "secondary"}
          onClick={() => setTab("customer")}
        >
          Customer menu
        </Button>
        <Button
          variant={tab === "staff" ? "primary" : "secondary"}
          onClick={() => setTab("staff")}
        >
          Staff orders ({state.foodOrders.length})
        </Button>
      </div>
      {tab === "customer" ? (
        <>
          <div className="demo-toolbar">
            <div>
              <span className="eyebrow">Saji / Freshly imagined</span>
              <h2>Something good is on the menu.</h2>
              <p>Choose an option, add an item and place a simulated order.</p>
            </div>
            <Select
              id="table-number"
              label="Your table"
              value={table}
              onChange={setTable}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Table {String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </Select>
          </div>
          <div className="filter-row" role="group" aria-label="Menu categories">
            {["All", "Mains", "Light bites", "Drinks"].map((c) => (
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
            <div className="demo-product-grid">
              {state.menu
                .filter((p) => category === "All" || p.category === category)
                .map((p) => (
                  <ProductTile key={p.id} product={p}>
                    <Select
                      id={`option-${p.id}`}
                      label={`${p.name} option`}
                      value={options[p.id] || p.variants![0].name}
                      onChange={(v) => setOptions({ ...options, [p.id]: v })}
                    >
                      {p.variants?.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name}
                          {v.extra ? ` (+${money(v.extra)})` : ""}
                        </option>
                      ))}
                    </Select>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        act(
                          "cart.add",
                          {
                            kind: "qr",
                            productId: p.id,
                            variant: options[p.id] || p.variants![0].name,
                          },
                          `${p.name} added to your order.`,
                        )
                      }
                    >
                      Add {p.name}
                    </Button>
                  </ProductTile>
                ))}
            </div>
            <Cart {...props} kind="qr">
              <Button
                disabled={busy || !state.carts.qr.length}
                onClick={() =>
                  act(
                    "qr.submit",
                    { table: Number(table) },
                    "Order received. Follow its progress below or open Staff orders.",
                  )
                }
              >
                Place simulated order
              </Button>
            </Cart>
          </div>
          <div className="demo-panel">
            <h2>Your order status</h2>
            {state.foodOrders.length ? (
              <div className="record-list">
                {state.foodOrders.map((o) => (
                  <article key={o.id}>
                    <div>
                      <strong>
                        {o.id} · Table {o.table}
                      </strong>
                      <p>
                        {o.lines
                          .map((l) => `${l.qty} × ${l.name} (${l.variant})`)
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <span className="status-tag">{o.status}</span>
                      <strong>{money(o.total)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>Your placed orders will appear here.</Empty>
            )}
          </div>
        </>
      ) : (
        <>
          <Stats
            items={[
              {
                label: "Received",
                value: state.foodOrders.filter((o) => o.status === "Received")
                  .length,
              },
              {
                label: "Preparing",
                value: state.foodOrders.filter((o) => o.status === "Preparing")
                  .length,
              },
              {
                label: "Ready",
                value: state.foodOrders.filter((o) => o.status === "Ready")
                  .length,
              },
              {
                label: "Completed",
                value: state.foodOrders.filter((o) => o.status === "Completed")
                  .length,
              },
            ]}
          />
          <div className="demo-panel">
            <div className="panel-heading">
              <h2>Kitchen order queue</h2>
              <span className="badge">Fictional orders only</span>
            </div>
            <p className="field-help">
              Use Refresh workspace to receive orders placed in another tab of
              this browser session.
            </p>
            {state.foodOrders.length ? (
              <div className="kitchen-grid">
                {state.foodOrders.map((o) => (
                  <article className="kitchen-ticket" key={o.id}>
                    <div>
                      <h3>Table {o.table}</h3>
                      <span>{o.id}</span>
                    </div>
                    <span className="status-tag">{o.status}</span>
                    <ul>
                      {o.lines.map((l) => (
                        <li key={l.key}>
                          {l.qty} × {l.name}
                          <small>{l.variant}</small>
                        </li>
                      ))}
                    </ul>
                    <strong>{money(o.total)}</strong>
                    <Button
                      disabled={
                        busy ||
                        state.role === "viewer" ||
                        o.status === "Completed"
                      }
                      onClick={() =>
                        act(
                          "qr.status",
                          { id: o.id },
                          "Kitchen status updated.",
                        )
                      }
                    >
                      {o.status === "Received"
                        ? "Start preparing"
                        : o.status === "Preparing"
                          ? "Mark ready"
                          : o.status === "Ready"
                            ? "Complete order"
                            : "Completed"}
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>No orders yet. Place one from the Customer menu.</Empty>
            )}
          </div>
        </>
      )}
    </>
  );
}
