"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button, Card, Field, Icon } from "@kezuvio/ui";
import { DemoFrame } from "../demos/frame";
import type { Packet } from "../../../../packages/database/index";
import type { Role } from "../../../../packages/demo-platform/index";
import "./labs.css";

const roles: Role[] = ["customer", "kitchen", "cashier", "manager", "viewer"];

export function useLabWorkspace(product: string) {
  const [packet, setPacket] = useState<Packet | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Loading your demo workspace…");
  const [expired, setExpired] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const current = useRef<Packet | null>(null);
  const locked = useRef(false);
  const mounted = useRef(false);
  const recovery = useRef(false);
  const ended = useRef(false);

  const request = useCallback(
    async (
      endpoint: "session" | "action",
      body?: Record<string, unknown>,
      message?: string,
    ): Promise<Packet | null> => {
      if (locked.current) return null;
      locked.current = true;
      setBusy(true);
      try {
        const response = await fetch(
          `/api/labs/${encodeURIComponent(product)}/${endpoint}`,
          {
            method: body ? "POST" : "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(15_000),
          },
        );
        const payload = await response.json();
        if (!mounted.current) return null;
        if (!response.ok) {
          setError(
            typeof payload.error === "string"
              ? payload.error
              : "The request could not be completed.",
          );
          if (response.status === 401) {
            ended.current = true;
            setExpired(true);
            current.current = null;
            setPacket(null);
            setStatus("Your demo session expired.");
          } else if (response.status === 409 || response.status >= 500) {
            recovery.current = true;
            setNeedsRefresh(true);
          }
          return null;
        }
        const next = payload as Packet;
        const previous = current.current;
        current.current = next;
        setPacket(next);
        setError("");
        setExpired(false);
        ended.current = false;
        recovery.current = false;
        setNeedsRefresh(false);
        if (previous && next.generation !== previous.generation) {
          setStatus("Workspace reset. All views now show the fresh demo data.");
        } else if (message) {
          setStatus(message);
        } else if (!previous) {
          setStatus("Your isolated demo workspace is ready.");
        } else if (previous.role !== next.role) {
          setStatus(`Simulated role changed to ${next.role}.`);
        }
        return next;
      } catch {
        if (mounted.current) {
          recovery.current = true;
          setNeedsRefresh(true);
          setError(
            body
              ? "The connection was interrupted. This action may have completed. Refresh to check the saved result before continuing."
              : "Unable to load the workspace. Check the connection, then refresh.",
          );
        }
        return null;
      } finally {
        locked.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [product],
  );

  const refresh = useCallback(
    () => request("session", undefined, "Workspace refreshed from saved data."),
    [request],
  );
  const startFresh = useCallback(
    () => request("session", {}, "A fresh isolated workspace is ready."),
    [request],
  );
  const act = useCallback(
    (
      type: string,
      args: Record<string, unknown> = {},
      message = "Changes saved.",
    ) => {
      const snapshot = current.current;
      if (!snapshot || recovery.current || ended.current || locked.current)
        return Promise.resolve(null);
      return request(
        "action",
        {
          type,
          args,
          requestId: crypto.randomUUID(),
          generation: snapshot.generation,
          csrf: snapshot.csrf,
        },
        message,
      );
    },
    [request],
  );

  useEffect(() => {
    mounted.current = true;
    void request("session");
    const timer = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !locked.current &&
        !recovery.current &&
        !ended.current
      ) {
        void request("session");
      }
    }, 5000);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [request]);

  return {
    packet,
    busy,
    error,
    status,
    expired,
    needsRefresh,
    refresh,
    startFresh,
    act,
  };
}

export type LabWorkspace = ReturnType<typeof useLabWorkspace>;

export function LabShell({
  title,
  category = "Interactive demo",
  description,
  workspace,
  children,
}: {
  title: string;
  category?: string;
  description: string;
  workspace: LabWorkspace;
  children: ReactNode;
}) {
  const {
    packet,
    busy,
    error,
    status,
    expired,
    needsRefresh,
    refresh,
    startFresh,
    act,
  } = workspace;
  const dialog = useRef<HTMLDialogElement>(null);
  const resetTrigger = useRef<HTMLButtonElement>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const update = () =>
      setRemaining(
        packet
          ? Math.max(
              0,
              Math.ceil((Date.parse(packet.expiresAt) - Date.now()) / 60_000),
            )
          : null,
      );
    update();
    const timer = window.setInterval(update, 15_000);
    return () => window.clearInterval(timer);
  }, [packet?.expiresAt]);
  const disabled = busy || needsRefresh;
  return (
    <DemoFrame
      title={title}
      category={category}
      description={description}
      className="labs-workspace"
    >
      {packet && (
        <div className="workspace-controls labs-toolbar">
          <div className="workspace-role field">
            <label htmlFor="labs-role">Demo role</label>
            <select
              id="labs-role"
              value={packet.role}
              disabled={disabled}
              onChange={(event) =>
                void act(
                  "role",
                  { role: event.target.value },
                  `Simulated role changed to ${event.target.value}.`,
                )
              }
            >
              {roles.map((role) => (
                <option value={role} key={role}>
                  {role[0].toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <p>
            Fictional data ·{" "}
            {remaining === null
              ? "Session active"
              : remaining > 0
                ? `Expires in ${remaining} min`
                : "Session expired"}
            <br />
            <small>Isolated to this demo workspace in your browser.</small>
          </p>
          <div className="button-row">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void refresh()}
            >
              Refresh workspace
            </Button>
            <button
              type="button"
              className="button secondary"
              ref={resetTrigger}
              disabled={disabled}
              onClick={() => dialog.current?.showModal()}
            >
              Reset demo
            </button>
          </div>
        </div>
      )}
      <p className="demo-feedback labs-status" role="status" aria-live="polite">
        {busy ? "Syncing workspace…" : status}
      </p>
      {error && (
        <div className="labs-error" role="alert">
          <p>{error}</p>
          {needsRefresh && packet && (
            <p>Use Refresh workspace above to load the latest saved state.</p>
          )}
        </div>
      )}
      {expired ? (
        <Card className="labs-empty">
          <h2>Your demo session has ended</h2>
          <p>
            Start a fresh workspace when you are ready. Your previous workspace
            will not be resumed.
          </p>
          <Button disabled={busy} onClick={() => void startFresh()}>
            Start fresh workspace
          </Button>
        </Card>
      ) : packet ? (
        children
      ) : (
        <Card className="labs-empty">
          <h2>
            {error ? "Workspace unavailable" : "Preparing your workspace"}
          </h2>
          <p>
            {error
              ? "Refresh to try loading your saved workspace again."
              : "Loading your fictional sample data."}
          </p>
          {error && (
            <Button disabled={busy} onClick={() => void refresh()}>
              Refresh workspace
            </Button>
          )}
        </Card>
      )}
      <div className="demo-disclaimer">
        <Icon name="check" />
        <p>
          Fictional data and simulated actions. No real payments. Roles are
          selectable examples within your own workspace. Use sample information
          only; do not enter personal or confidential information.
        </p>
      </div>
      <dialog
        className="labs-dialog"
        ref={dialog}
        aria-labelledby="labs-reset-title"
        aria-describedby="labs-reset-description"
        onClose={() => resetTrigger.current?.focus()}
      >
        <h2 id="labs-reset-title">Reset this demo workspace?</h2>
        <p id="labs-reset-description">
          This replaces this product’s fictional data with fresh samples in all
          tabs sharing this workspace. Other products and browser sessions are
          unaffected.
        </p>
        <div className="labs-actions">
          <Button
            variant="secondary"
            autoFocus
            onClick={() => dialog.current?.close()}
          >
            Keep my data
          </Button>
          <Button
            disabled={disabled}
            onClick={() => {
              dialog.current?.close();
              void act(
                "reset",
                {},
                "Workspace reset with fresh sample data.",
              ).finally(() => resetTrigger.current?.focus());
            }}
          >
            Confirm reset
          </Button>
        </div>
      </dialog>
    </DemoFrame>
  );
}

type FixtureProjection = {
  stock: number;
  consumed: number;
  totalSen?: number;
  managerNote?: string;
};

export function PlatformCheck() {
  const workspace = useLabWorkspace("platform-check");
  const state = workspace.packet?.state as FixtureProjection | undefined;
  const [note, setNote] = useState("");
  useEffect(() => {
    setNote(state?.managerNote ?? "");
  }, [state?.managerNote, workspace.packet?.generation]);
  const canConsume =
    workspace.packet?.role === "cashier" ||
    workspace.packet?.role === "manager";
  const disabled = workspace.busy || workspace.needsRefresh;
  return (
    <LabShell
      title="Shared platform check"
      description="Explore persisted data, simulated permissions and an isolated reset."
      workspace={workspace}
    >
      {state && (
        <div className="labs-grid">
          <Card className="labs-panel">
            <h2>Sample inventory</h2>
            <dl className="labs-metrics">
              <div>
                <dt>Stock remaining</dt>
                <dd data-testid="fixture-stock">{state.stock}</dd>
              </div>
              <div>
                <dt>Units consumed</dt>
                <dd data-testid="fixture-consumed">{state.consumed}</dd>
              </div>
              {typeof state.totalSen === "number" && (
                <div>
                  <dt>Simulated total</dt>
                  <dd>RM {(state.totalSen / 100).toFixed(2)}</dd>
                </div>
              )}
            </dl>
            <Button
              disabled={disabled || !canConsume || state.stock === 0}
              onClick={() =>
                void workspace.act(
                  "fixture.consume",
                  {},
                  "One sample unit consumed.",
                )
              }
            >
              Consume sample stock
            </Button>
            <p>
              {canConsume
                ? "One fictional unit is available after each reset."
                : "Choose Cashier or Manager to consume sample stock."}
            </p>
          </Card>
          <Card className="labs-panel">
            <h2>Role permissions</h2>
            <p>
              Customer and Viewer can inspect public data. Kitchen sees stock
              without financial totals. Cashier can consume stock. Manager can
              also edit the private note.
            </p>
            {workspace.packet?.role === "manager" && (
              <form
                className="labs-note"
                onSubmit={(event) => {
                  event.preventDefault();
                  void workspace.act(
                    "fixture.note",
                    { note },
                    "Manager note saved.",
                  );
                }}
              >
                <Field
                  id="labs-manager-note"
                  label="Manager note"
                  value={note}
                  maxLength={500}
                  disabled={disabled}
                  onChange={(event) => setNote(event.target.value)}
                />
                <Button type="submit" disabled={disabled}>
                  Save note
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}
    </LabShell>
  );
}
