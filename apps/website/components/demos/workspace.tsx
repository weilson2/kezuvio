"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Icon } from "@kezuvio/ui";
import { demos } from "@/lib/demo/catalog";
import type { DemoState } from "@/lib/demo/engine";
import { BusinessDemo } from "./business";
import { QrDemo } from "./qr";
import { BookingDemo } from "./booking";
import { CommerceDemo } from "./commerce";
import { ManagementDemo } from "./management";
type Packet = {
  state: DemoState;
  csrf: string;
  expiresAt: number;
  error?: string;
};
export function DemoWorkspace({ slug }: { slug: string }) {
  const [packet, setPacket] = useState<Packet | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [confirmReset, setConfirmReset] = useState(false);
  const lock = useRef(false);
  const demo = demos.find((d) => d.slug === slug)!;
  async function refresh() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/demo/session", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPacket(data);
      setStatus("Workspace loaded. All information is fictional.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the demo.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function act(
    action: string,
    args: Record<string, unknown> = {},
    message = "Workspace updated.",
  ) {
    if (!packet || lock.current) return null;
    lock.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/demo/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          args,
          csrf: packet.csrf,
          requestId: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPacket(data);
      setStatus(message);
      return data.state as DemoState;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Action failed. Refresh to check your workspace before retrying.",
      );
      return null;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const props = packet ? { state: packet.state, busy, act } : null;
  return (
    <div className="demo-page">
      <div className="container demo-page-heading">
        <Link href="/demo" className="text-link">
          ← All demonstrations
        </Link>
        <div className="demo-title-row">
          <div>
            <span className="eyebrow">{demo.category}</span>
            <h1>{demo.name}</h1>
          </div>
          <span className="demo-pill">DEMO MODE</span>
        </div>
        <p>{demo.description}</p>
      </div>
      <section
        className="container demo-workspace"
        aria-label={`${demo.name} demonstration`}
      >
        <div className="workspace-controls">
          <div className="workspace-role field">
            <label htmlFor="demo-role">Demo role</label>
            <select
              id="demo-role"
              value={packet?.state.role || "manager"}
              disabled={busy || !packet}
              onChange={(e) =>
                act(
                  "role",
                  { role: e.target.value },
                  "Demo role changed. Permissions are checked on the server.",
                )
              }
            >
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <p>
            Fictional data · 1-hour session
            <br />
            <small>Shared across these demos in this browser.</small>
          </p>
          <div className="button-row">
            <Button variant="secondary" disabled={busy} onClick={refresh}>
              Refresh workspace
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !packet}
              onClick={() => setConfirmReset(!confirmReset)}
            >
              Reset demos
            </Button>
          </div>
        </div>
        {confirmReset && (
          <div className="reset-confirm">
            <p>
              Reset all six demos in this browser to their original sample data?
              Current sample changes will be removed.
            </p>
            <Button
              disabled={busy}
              onClick={async () => {
                const result = await act(
                  "reset",
                  {},
                  "All demos reset to their original sample data.",
                );
                if (result) setConfirmReset(false);
              }}
            >
              Confirm reset
            </Button>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Keep my changes
            </Button>
          </div>
        )}
        <div className="demo-feedback" aria-live="polite">
          <span>{busy ? "Updating workspace…" : status}</span>
        </div>
        {error && (
          <div className="notice demo-error" role="alert">
            {error}{" "}
            <button onClick={refresh} disabled={busy}>
              Refresh or start again
            </button>
          </div>
        )}
        {!props ? (
          <div className="demo-loading">
            <Icon name="layers" />
            <p>
              {error
                ? "The workspace could not load. Use Refresh workspace to retry."
                : "Preparing your sample workspace…"}
            </p>
          </div>
        ) : slug === "business-website" ? (
          <BusinessDemo {...props} />
        ) : slug === "qr-ordering" ? (
          <QrDemo {...props} />
        ) : slug === "booking" ? (
          <BookingDemo {...props} />
        ) : slug === "sme-management" ? (
          <ManagementDemo {...props} />
        ) : (
          <CommerceDemo {...props} kind={slug === "pos" ? "pos" : "shop"} />
        )}
        <div className="demo-disclaimer">
          <Icon name="check" />
          <p>
            No real payments, messages or business records. Role changes affect
            only your sample workspace. Data clears on expiry, reset or server
            restart. Do not enter personal or confidential information.
          </p>
        </div>
      </section>
    </div>
  );
}
