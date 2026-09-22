"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Badge, Button, Field } from "@kezuvio/ui";
import { Empty, Stats } from "./demos/shared";
import "./operations.css";

type Status =
  | "awaiting_approval"
  | "approved"
  | "running"
  | "succeeded"
  | "failed"
  | "timed_out"
  | "interrupted";
type Task = {
  id: string;
  title: string;
  role: string;
  check: string;
  status: Status;
  attempts: number;
  timeoutSeconds: number;
  createdAt: string;
  updatedAt: string;
  logs: { at: string; event: string; detail: string }[];
};
type Snapshot = {
  csrf: string;
  roles: { id: string; name: string; responsibility: string }[];
  checks: { id: string; label: string }[];
  tasks: Task[];
  metrics: {
    tasks: number;
    attempts: number;
    elapsedMs: number;
    aiTokens: null;
    additionalPaidCostSen: number;
  };
  mode: string;
};
const statusLabel: Record<Status, string> = {
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
  timed_out: "Timed out",
  interrupted: "Interrupted",
};
const endpoint = "/api/operations";
const stamp = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value)) + " MYT";
const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});
function TaskCard({
  task,
  snapshot,
  busy,
  mutate,
}: {
  task: Task;
  snapshot: Snapshot;
  busy: boolean;
  mutate: (
    action: string,
    fields?: Record<string, unknown>,
    message?: string,
  ) => Promise<boolean>;
}) {
  const role = snapshot.roles.find((item) => item.id === task.role);
  const check = snapshot.checks.find((item) => item.id === task.check);
  const running = snapshot.tasks.some((item) => item.status === "running");
  return (
    <article
      className="demo-panel operations-card"
      data-testid={`operations-task-${task.id}`}
    >
      <div className="operations-card-top">
        <h3>{task.title}</h3>
        <Badge>{statusLabel[task.status]}</Badge>
      </div>
      <p>
        {role?.name ?? task.role} · {check?.label ?? task.check}
      </p>
      <p className="operations-muted">
        Attempt {task.attempts} of 3 · timeout {task.timeoutSeconds} seconds ·
        updated {stamp(task.updatedAt)}
      </p>
      <div className="labs-actions">
        {task.status === "awaiting_approval" && (
          <Button
            disabled={busy}
            onClick={() =>
              void mutate(
                "approve",
                { id: task.id },
                "Human approval recorded for this local check.",
              )
            }
          >
            Approve local check
          </Button>
        )}
        {task.status === "approved" && (
          <Button
            disabled={busy || running}
            onClick={() =>
              void mutate(
                "run",
                { id: task.id },
                "Local validation check finished. Inspect its recorded result.",
              )
            }
          >
            Run local check
          </Button>
        )}
        {["failed", "timed_out", "interrupted"].includes(task.status) &&
          task.attempts < 3 && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void mutate(
                  "retry",
                  { id: task.id },
                  "Retry requested. A new human approval is required.",
                )
              }
            >
              Request retry
            </Button>
          )}
      </div>
      {task.status === "awaiting_approval" && (
        <p className="operations-muted">
          Approval authorizes only the named local validation check. It grants
          no production, payment, publication, messaging or credential
          authority.
        </p>
      )}
      {task.status === "running" && (
        <p role="status">
          The bounded local check is running. Only one check may execute at a
          time.
        </p>
      )}
      {task.attempts >= 3 &&
        ["failed", "timed_out", "interrupted"].includes(task.status) && (
          <p>
            Retry limit reached. Review the cause before preparing a separate
            task.
          </p>
        )}
      {task.logs.length > 0 && (
        <details>
          <summary>Execution log · {task.logs.length} entries</summary>
          <ol className="operations-logs">
            {task.logs.map((entry, index) => (
              <li key={`${entry.at}:${index}`}>
                <div className="operations-card-top">
                  <strong>{entry.event}</strong>
                  <small>{stamp(entry.at)}</small>
                </div>
                <pre>{entry.detail}</pre>
              </li>
            ))}
          </ol>
        </details>
      )}
    </article>
  );
}
export function OperationsWorkspace() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(
    "Checking the local operations session…",
  );
  const [key, setKey] = useState("");
  const [filter, setFilter] = useState("");
  const packet = useRef<Snapshot | null>(null);
  const locked = useRef(false);
  const mounted = useRef(false);
  const request = useCallback(
    async (
      action?: string,
      fields: Record<string, unknown> = {},
      message = "Local task state refreshed.",
    ) => {
      if (locked.current) return false;
      locked.current = true;
      setBusy(true);
      const task =
        typeof fields.id === "string"
          ? packet.current?.tasks.find((item) => item.id === fields.id)
          : undefined;
      const timeout =
        action === "run"
          ? Math.min(180000, ((task?.timeoutSeconds ?? 120) + 15) * 1000)
          : 15000;
      try {
        const response = await fetch(endpoint, {
          method: action ? "POST" : "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: action
            ? {
                "Content-Type": "application/json",
                ...(action !== "login" && packet.current
                  ? { "X-Operations-CSRF": packet.current.csrf }
                  : {}),
              }
            : undefined,
          body: action ? JSON.stringify({ action, ...fields }) : undefined,
          signal: AbortSignal.timeout(timeout),
        });
        const body = await response.json();
        if (!mounted.current) return false;
        if (!response.ok) {
          if (response.status === 401) {
            packet.current = null;
            setSnapshot(null);
            setStatus("Authenticate with the separate local operations key.");
          }
          if (action || response.status !== 401)
            setError(
              typeof body.error === "string"
                ? body.error
                : "Unable to complete this local action.",
            );
          return false;
        }
        if (action === "logout") {
          packet.current = null;
          setSnapshot(null);
          setKey("");
          setStatus("Signed out. The local session has been revoked.");
          setError("");
          return true;
        }
        let next = body as Snapshot;
        if (action === "login") {
          const authenticated = await fetch(endpoint, {
            credentials: "same-origin",
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          });
          if (!authenticated.ok)
            throw new Error(
              "The session could not be loaded. Try authenticating again.",
            );
          next = (await authenticated.json()) as Snapshot;
        }
        packet.current = next;
        setSnapshot(next);
        setError("");
        setStatus(message);
        return true;
      } catch {
        if (mounted.current)
          setError(
            action
              ? "The connection was interrupted. The action may have completed. Refresh the task state before trying again."
              : "Unable to load the local operations service. Check that it is configured and running, then refresh.",
          );
        return false;
      } finally {
        locked.current = false;
        if (mounted.current) {
          setBusy(false);
          setLoading(false);
        }
      }
    },
    [],
  );
  useEffect(() => {
    mounted.current = true;
    void request();
    const timer = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        packet.current &&
        !locked.current
      )
        void request();
    }, 5000);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [request]);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const secret = key;
    setKey("");
    await request(
      "login",
      { key: secret },
      "Authenticated local operations session ready.",
    );
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const result = await request(
      "create",
      {
        title: String(values.get("title") ?? ""),
        role: String(values.get("role") ?? ""),
        check: String(values.get("check") ?? ""),
        timeoutSeconds: Number(values.get("timeout")),
      },
      "Task created. Human approval is required before execution.",
    );
    if (result) form.reset();
  }
  return (
    <section
      className="container content-bottom operations-app"
      aria-label="Local operations workspace"
    >
      <div className="operations-notice">
        <strong>Authenticated loopback workspace</strong>
        <p>
          Role assignments record ownership and handoffs. Executing a task runs
          only a named local validation check. AI model dispatch remains manual
          in Codex, and task titles are inert labels rather than commands.
        </p>
      </div>
      <p
        role="status"
        className="operations-muted"
        style={{ margin: "20px 0" }}
      >
        {status}
      </p>
      {error && (
        <p role="alert" className="operations-notice operations-error">
          {error}
        </p>
      )}
      {loading ? (
        <p>Loading the local service…</p>
      ) : !snapshot ? (
        <form
          className="demo-panel operations-form operations-login"
          onSubmit={login}
          aria-labelledby="operations-login-heading"
        >
          <h2 id="operations-login-heading">Authenticate to the local desk</h2>
          <Field
            id="operations-key"
            label="Local access key"
            type="password"
            autoComplete="current-password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            required
            disabled={busy}
            help="Use the key from the local operations setup. Demo role selectors do not provide access."
          />
          <div className="labs-actions">
            <Button type="submit" disabled={busy}>
              Sign in locally
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void request()}
            >
              Check session
            </Button>
          </div>
        </form>
      ) : (
        <>
          <header className="operations-heading">
            <h2>Local task coordination</h2>
            <div className="labs-actions">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void request()}
              >
                Refresh task state
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void request("logout")}
              >
                Sign out
              </Button>
            </div>
          </header>
          <p className="operations-notice">
            {typeof snapshot.mode === "string"
              ? snapshot.mode
              : JSON.stringify(snapshot.mode)}
          </p>
          <div className="operations-metrics">
            <Stats
              items={[
                { label: "Recorded tasks", value: snapshot.metrics.tasks },
                {
                  label: "Execution attempts",
                  value: snapshot.metrics.attempts,
                },
                {
                  label: "Measured check time",
                  value: `${snapshot.metrics.elapsedMs} ms`,
                },
                { label: "AI token usage", value: "Not measured" },
                {
                  label: "Additional paid services",
                  value: money.format(
                    snapshot.metrics.additionalPaidCostSen / 100,
                  ),
                },
              ]}
            />
          </div>
          <section aria-labelledby="operations-role-heading">
            <div className="operations-heading">
              <h2 id="operations-role-heading">Six role assignments</h2>
            </div>
            <div className="operations-role-grid">
              {snapshot.roles.map((role) => (
                <article className="demo-panel operations-card" key={role.id}>
                  <h3>{role.name}</h3>
                  <p>{role.responsibility}</p>
                  <small>Local task ownership and review handoff</small>
                </article>
              ))}
            </div>
          </section>
          <div className="operations-grid" style={{ marginTop: 28 }}>
            <form
              className="demo-panel operations-form"
              onSubmit={create}
              aria-labelledby="operations-create-heading"
            >
              <h2 id="operations-create-heading">Assign a local check</h2>
              <fieldset className="operations-fields" disabled={busy}>
                <div className="operations-span">
                  <Field
                    id="operations-title"
                    name="title"
                    label="Task title"
                    required
                    minLength={3}
                    maxLength={120}
                    placeholder="A clear label for the validation work"
                  />
                </div>
                <div className="field">
                  <label htmlFor="operations-role">Assigned role</label>
                  <select
                    id="operations-role"
                    name="role"
                    defaultValue={
                      snapshot.roles.find((role) => role.id === "ada")?.id ??
                      snapshot.roles[0]?.id
                    }
                  >
                    {snapshot.roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="operations-check">
                    Allowed validation check
                  </label>
                  <select
                    id="operations-check"
                    name="check"
                    defaultValue={
                      snapshot.checks.find((check) => check.id === "brand")
                        ?.id ?? snapshot.checks[0]?.id
                    }
                  >
                    {snapshot.checks.map((check) => (
                      <option key={check.id} value={check.id}>
                        {check.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  id="operations-timeout"
                  name="timeout"
                  label="Timeout (seconds)"
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  defaultValue={10}
                  required
                />
              </fieldset>
              <p className="operations-muted">
                Only the server-listed checks are executable. Each task needs
                human approval; a retry returns to approval and is limited to
                three attempts.
              </p>
              <div className="labs-actions">
                <Button type="submit" disabled={busy}>
                  Create task for approval
                </Button>
              </div>
            </form>
            <section
              className="demo-panel operations-card"
              aria-label="Local mock events"
            >
              <h2>Mobile mock-event rehearsal</h2>
              <p>
                Rehearse a status request or fixed task creation through this
                authenticated local endpoint. No Telegram service or external
                messaging connection is active.
              </p>
              <div className="labs-actions">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void request(
                      "mock",
                      { event: "status" },
                      "Mock status event handled locally. No message was sent.",
                    )
                  }
                >
                  Mock status event
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void request(
                      "mock",
                      { event: "create" },
                      "Mock task-create event recorded. Approval is still required.",
                    )
                  }
                >
                  Mock task-create event
                </Button>
              </div>
              <h3>Execution boundaries</h3>
              <ul className="operations-checks">
                <li>
                  Production changes, payments and publishing require separate
                  authorization.
                </li>
                <li>
                  No customer messages, credential changes or arbitrary shell
                  commands are available.
                </li>
                <li>
                  Logs and task history are bounded; model usage and billing
                  entitlements are not inferred.
                </li>
              </ul>
            </section>
          </div>
          <section
            className="operations-task-list"
            aria-labelledby="operations-task-heading"
          >
            <div className="operations-heading">
              <h2 id="operations-task-heading">Task history & approvals</h2>
            </div>
            <div className="field operations-filters">
              <label htmlFor="operations-filter">Filter task status</label>
              <select
                id="operations-filter"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="">All task statuses</option>
                {Object.entries(statusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="operations-stack">
              {snapshot.tasks.filter(
                (task) => !filter || task.status === filter,
              ).length ? (
                [...snapshot.tasks]
                  .reverse()
                  .filter((task) => !filter || task.status === filter)
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      snapshot={snapshot}
                      busy={busy}
                      mutate={request}
                    />
                  ))
              ) : (
                <Empty>
                  No tasks match this view. Create a named local check to begin.
                </Empty>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
