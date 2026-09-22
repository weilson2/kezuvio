"use client";

import Link from "next/link";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Badge, Button, Field, TextArea } from "@kezuvio/ui";
import { Empty, Stats } from "./demos/shared";
import {
  LabShell,
  useLabWorkspace,
  type LabWorkspace,
} from "./labs/platform-shell";
import type {
  AutomationView,
  Task,
  Quote,
} from "../../../packages/automation/index";
import { parseSen } from "../../../packages/automation/rules";
import {
  workflowFor,
  workflowStages,
} from "../../../packages/studio/inquiry-workflow";
import "./inquiry.css";

const currency = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});
const rm = (value: number) => currency.format(value / 100);
const stamp = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value)) + " MYT";
const read = (form: FormData, name: string) => String(form.get(name) ?? "");
const busy = (workspace: LabWorkspace) =>
  workspace.busy || workspace.needsRefresh;
const localInput = (milliseconds: number) =>
  new Date(milliseconds + 8 * 3600000).toISOString().slice(0, 16);
function instant(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Choose a valid date and time in Malaysia.");
  const result = new Date(value + ":00+08:00");
  if (
    !Number.isFinite(result.getTime()) ||
    localInput(result.getTime()) !== value
  )
    throw new Error("Choose a valid calendar date and time.");
  return result.toISOString();
}
function Form({
  title,
  workspace,
  submit,
  children,
  button,
}: {
  title: string;
  workspace: LabWorkspace;
  submit: (form: FormData) => Promise<unknown>;
  children: ReactNode;
  button: string;
}) {
  const id = useId();
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await submit(new FormData(event.currentTarget));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Check the entered details.",
      );
    }
  }
  return (
    <form
      className="demo-panel inquiry-form"
      aria-labelledby={id}
      onSubmit={save}
    >
      <h3 id={id}>{title}</h3>
      <fieldset className="inquiry-fields" disabled={busy(workspace)}>
        {children}
      </fieldset>
      {error && (
        <p className="inquiry-error" role="alert">
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
function Intake({
  workspace,
  onSaved,
}: {
  workspace: LabWorkspace;
  onSaved: (id: string) => void;
}) {
  return (
    <Form
      title="New fictional inquiry"
      workspace={workspace}
      button="Save fictional inquiry"
      submit={async (form) => {
        const email = read(form, "email").trim().toLowerCase();
        if (!/^[a-z0-9._+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.test$/.test(email))
          throw new Error(
            "Use a fictional .test email address. This workflow does not accept real contact details.",
          );
        if (form.get("fictional") !== "on")
          throw new Error(
            "Confirm that this is fictional demonstration information.",
          );
        const existing = new Set(
          (
            workspace.packet?.state as AutomationView | undefined
          )?.inquiries.map((item) => item.id),
        );
        const result = await workspace.act(
          "inquiry.submit",
          {
            businessName: read(form, "business"),
            contactName: read(form, "contact"),
            email,
            brief: read(form, "brief"),
            budgetSen: parseSen(read(form, "budget"), 10000000, true),
            timelineWeeks: Number(read(form, "weeks")),
          },
          "Fictional inquiry saved. Qualification is queued for Manager review.",
        );
        if (result) {
          const added = (result.state as AutomationView).inquiries.find(
            (item) => !existing.has(item.id),
          );
          if (added) onSaved(added.id);
          window.dispatchEvent(new CustomEvent("kezuvio:quotation-inquiry"));
        }
        return result;
      }}
    >
      <Field
        id="inquiry-business"
        name="business"
        label="Fictional business name"
        defaultValue="Sample Bunga Studio"
        maxLength={80}
        required
      />
      <Field
        id="inquiry-contact"
        name="contact"
        label="Fictional contact name"
        defaultValue="Sample Aina"
        maxLength={80}
        required
      />
      <div className="inquiry-span">
        <Field
          id="inquiry-email"
          name="email"
          label="Fictional email"
          type="email"
          defaultValue="aina@example.test"
          maxLength={120}
          required
          help="Only .test addresses. Nothing is emailed, submitted to a customer system or copied from the contact form."
        />
      </div>
      <div className="inquiry-span">
        <TextArea
          id="inquiry-brief"
          name="brief"
          label="Fictional project brief"
          defaultValue="A fictional website with an online booking workflow."
          rows={4}
          minLength={20}
          maxLength={2000}
          required
        />
      </div>
      <Field
        id="inquiry-budget"
        name="budget"
        label="Illustrative budget (RM)"
        defaultValue="5000.00"
        inputMode="decimal"
        required
      />
      <Field
        id="inquiry-weeks"
        name="weeks"
        label="Timeline (weeks)"
        type="number"
        defaultValue={6}
        min={1}
        max={52}
        step={1}
        required
      />
      <label className="inquiry-ack inquiry-span">
        <input type="checkbox" name="fictional" required />
        <span>
          I am using fictional demonstration information, not real customer
          details.
        </span>
      </label>
    </Form>
  );
}
function Progress({
  inquiryId,
  view,
}: {
  inquiryId?: string;
  view: AutomationView;
}) {
  const workflow = inquiryId ? workflowFor(inquiryId, view) : null;
  const steps =
    workflow?.steps ??
    workflowStages.map((name, index) => ({
      name,
      status: index === 0 ? "current" : "pending",
    }));
  return (
    <ol className="inquiry-steps" aria-label="Inquiry workflow progress">
      {steps.map((step, index) => (
        <li
          key={step.name}
          data-complete={step.status === "done"}
          aria-current={step.status === "current" ? "step" : undefined}
        >
          <span className="eyebrow">0{index + 1}</span>
          <strong>{step.name}</strong>
          <small>
            {step.status === "done"
              ? "Recorded"
              : step.status === "current"
                ? "Current step"
                : "Awaiting previous step"}
          </small>
        </li>
      ))}
    </ol>
  );
}
async function runTask(workspace: LabWorkspace, task: Task) {
  let current = task;
  if (current.status === "Failed") {
    const retried = await workspace.act(
      "task.retry",
      { id: current.id },
      "Retry queued for explicit local execution.",
    );
    if (!retried) return null;
    current = (retried.state as AutomationView).tasks.find(
      (item) => item.id === task.id,
    )!;
  }
  if (current.status === "Queued") {
    const started = await workspace.act(
      "task.start",
      { id: current.id },
      "Local task claimed. No external service is called.",
    );
    if (!started) return null;
    current = (started.state as AutomationView).tasks.find(
      (item) => item.id === task.id,
    )!;
  }
  if (current.status === "Running" && current.runId)
    return workspace.act(
      "task.finish",
      { id: current.id, runId: current.runId, fail: false },
      current.kind === "Analyze"
        ? "Qualification and quotation draft saved."
        : "Approved proposal prepared as an unsent demo copy.",
    );
  return null;
}
function Execution({
  task,
  workspace,
  kind,
}: {
  task: Task;
  workspace: LabWorkspace;
  kind: "analysis" | "proposal";
}) {
  const expired =
    !!task.leaseUntil && Date.parse(task.leaseUntil) <= Date.now();
  const canRun =
    ["Queued", "Running", "Failed"].includes(task.status) &&
    !(task.status === "Failed" && task.attempts >= 3);
  return (
    <section
      className="demo-panel inquiry-card"
      aria-label={
        kind === "analysis" ? "Qualification task" : "Proposal preparation task"
      }
    >
      <div className="inquiry-card-top">
        <h3>
          {kind === "analysis"
            ? "Local qualification task"
            : "Approved proposal preparation"}
        </h3>
        <Badge>{task.status}</Badge>
      </div>
      <p className="inquiry-muted">
        Attempt {task.attempts} of 3 · actual saved task state.{" "}
        {kind === "analysis"
          ? "Versioned local rules explain the suggested work and create the draft."
          : "Preparation checks the current approved quotation revision. Output remains unsent."}
      </p>
      {task.error && <p className="inquiry-error">{task.error}</p>}
      {canRun && (
        <div className="labs-actions">
          {expired && task.status === "Running" ? (
            <Button
              variant="secondary"
              disabled={busy(workspace)}
              onClick={() =>
                void workspace.act(
                  "task.recover",
                  { id: task.id },
                  "Interrupted task recovered. Review before retrying.",
                )
              }
            >
              Recover interrupted task
            </Button>
          ) : (
            <Button
              disabled={busy(workspace)}
              onClick={() => void runTask(workspace, task)}
            >
              {task.status === "Running"
                ? "Complete saved task"
                : task.status === "Failed"
                  ? "Retry local task"
                  : kind === "analysis"
                    ? "Qualify and draft quotation"
                    : "Run proposal preparation"}
            </Button>
          )}
        </div>
      )}
      {task.status === "Failed" && task.attempts >= 3 && (
        <p>
          Retry limit reached. Inspect the saved history in the advanced
          Automation Hub, or reset this fictional workspace.
        </p>
      )}
    </section>
  );
}
function Review({
  quote,
  workspace,
}: {
  quote: Quote;
  workspace: LabWorkspace;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  async function decide(type: "quote.approve" | "quote.reject") {
    setError("");
    if (note.trim().length < 3) {
      setError("Record a review note of at least three characters.");
      return;
    }
    await workspace.act(
      type,
      { id: quote.id, revision: quote.revision, note },
      type === "quote.approve"
        ? "Current quotation revision approved by the simulated reviewer."
        : "Quotation rejected for revision. Preparation remains blocked.",
    );
  }
  return (
    <section
      className="demo-panel inquiry-card"
      aria-label="Human quotation review"
    >
      <h3>Human review of revision {quote.revision}</h3>
      <p>
        Review the scope, rates, exclusions and total before recording a
        decision. Approving permits local preparation; it does not send a
        proposal or establish a real commercial agreement.
      </p>
      <TextArea
        id={`inquiry-review-${quote.id}`}
        label="Review note"
        rows={3}
        maxLength={300}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        disabled={busy(workspace)}
      />
      {error && (
        <p role="alert" className="inquiry-error">
          {error}
        </p>
      )}
      <div className="labs-actions">
        <Button
          disabled={busy(workspace)}
          onClick={() => void decide("quote.approve")}
        >
          Approve quotation
        </Button>
        <Button
          variant="secondary"
          disabled={busy(workspace)}
          onClick={() => void decide("quote.reject")}
        >
          Reject quotation
        </Button>
      </div>
    </section>
  );
}
function Followups({
  inquiryId,
  view,
  workspace,
  ready,
}: {
  inquiryId: string;
  view: AutomationView;
  workspace: LabWorkspace;
  ready: boolean;
}) {
  const items = view.followups.filter((item) => item.inquiryId === inquiryId);
  return (
    <div className="inquiry-stack">
      {ready ? (
        <Form
          title="Schedule an internal follow-up"
          workspace={workspace}
          button="Schedule internal follow-up"
          submit={(form) =>
            workspace.act(
              "followup.create",
              {
                inquiryId,
                dueAt: instant(read(form, "due")),
                note: read(form, "note"),
              },
              "Internal reminder saved. No message is scheduled or sent.",
            )
          }
        >
          <Field
            id={`inquiry-due-${inquiryId}`}
            name="due"
            label="Follow-up due (MYT)"
            type="datetime-local"
            defaultValue={localInput(Date.now() + 86400000)}
            required
          />
          <Field
            id={`inquiry-note-${inquiryId}`}
            name="note"
            label="Internal follow-up note"
            defaultValue="Review the fictional scope and quotation assumptions."
            maxLength={300}
            required
          />
        </Form>
      ) : (
        <p className="inquiry-notice">
          A current approved Ready proposal is required before creating or
          completing follow-ups in this view. A revision or rejection closes
          this step until review and preparation are repeated.
        </p>
      )}
      {items.map((item) => (
        <article
          className="demo-panel inquiry-card"
          key={item.id}
          data-testid={`inquiry-followup-${item.id}`}
        >
          <div className="inquiry-card-top">
            <h3>Internal follow-up</h3>
            <Badge>{item.overdue ? "Overdue" : item.status}</Badge>
          </div>
          <p>{item.note}</p>
          <p className="inquiry-muted">Due {stamp(item.dueAt)}</p>
          {item.status === "Completed" ? (
            <p>
              {item.completionNote} ·{" "}
              {item.completedAt && stamp(item.completedAt)}
            </p>
          ) : (
            ready && (
              <Form
                title="Record manual completion"
                workspace={workspace}
                button="Complete internal follow-up"
                submit={(form) =>
                  workspace.act(
                    "followup.complete",
                    { id: item.id, note: read(form, "completion") },
                    "Follow-up completed manually. Nothing was sent.",
                  )
                }
              >
                <div className="inquiry-span">
                  <Field
                    id={`inquiry-complete-${item.id}`}
                    name="completion"
                    label="Completion note"
                    maxLength={300}
                    required
                  />
                </div>
              </Form>
            )
          )}
        </article>
      ))}
    </div>
  );
}
function Detail({
  view,
  inquiryId,
  workspace,
  manager,
}: {
  view: AutomationView;
  inquiryId: string;
  workspace: LabWorkspace;
  manager: boolean;
}) {
  const inquiry = view.inquiries.find((item) => item.id === inquiryId)!;
  const workflow = workflowFor(inquiryId, view)!;
  const analysis = view.analyses.find(
    (item) => item.id === workflow.analysisId,
  );
  const quote = view.quotes.find((item) => item.id === workflow.quoteId);
  const analyze = view.tasks.find(
    (item) => item.inquiryId === inquiryId && item.kind === "Analyze",
  );
  const preparation = quote
    ? [...view.tasks]
        .reverse()
        .find(
          (item) =>
            item.quoteId === quote.id &&
            item.quoteRevision === quote.revision &&
            item.kind === "Prepare ready",
        )
    : undefined;
  async function prepare() {
    if (!quote || !workflow.canPrepare) return;
    if (preparation && preparation.status !== "Succeeded") {
      await runTask(workspace, preparation);
      return;
    }
    const queued = await workspace.act(
      "quote.queue-ready",
      { id: quote.id, revision: quote.revision },
      "Approved revision queued for local proposal preparation.",
    );
    if (!queued) return;
    const task = [...(queued.state as AutomationView).tasks]
      .reverse()
      .find(
        (item) =>
          item.quoteId === quote.id &&
          item.quoteRevision === quote.revision &&
          item.kind === "Prepare ready",
      );
    if (task) await runTask(workspace, task);
  }
  return (
    <div className="inquiry-stack" data-testid={`inquiry-record-${inquiryId}`}>
      <Progress inquiryId={inquiryId} view={view} />
      <section className="demo-panel inquiry-card">
        <div className="inquiry-card-top">
          <h2>{inquiry.businessName}</h2>
          <Badge>Inquiry {inquiry.number}</Badge>
        </div>
        <p>{inquiry.brief}</p>
        <p className="inquiry-muted">
          {inquiry.contactName} · {inquiry.email} · {rm(inquiry.budgetSen)}{" "}
          illustrative budget · {inquiry.timelineWeeks} weeks
        </p>
      </section>
      {manager && analyze && !analysis && (
        <Execution task={analyze} workspace={workspace} kind="analysis" />
      )}
      {!analysis && !manager && (
        <p className="inquiry-notice">
          Your fictional inquiry is saved. Switch the simulated role to Manager
          to qualify it and create a quotation draft with the local task queue.
        </p>
      )}
      {analysis && (
        <section
          className="demo-panel inquiry-card"
          aria-label="Qualification reasoning"
        >
          <h3>Qualification reasoning</h3>
          <p>{analysis.summary}</p>
          <ul className="inquiry-reasons">
            {analysis.requirements.map((requirement) => (
              <li key={requirement.key}>
                <strong>{requirement.label}</strong>
                <p className="inquiry-muted">{requirement.reason}</p>
              </li>
            ))}
          </ul>
          {analysis.warnings.map((warning) => (
            <p className="inquiry-notice" key={warning}>
              {warning}
            </p>
          ))}
        </section>
      )}
      {quote && (
        <section
          className="demo-panel inquiry-card"
          aria-label="Current quotation"
        >
          <div className="inquiry-card-top">
            <h3>Quotation draft · revision {quote.revision}</h3>
            <Badge>{quote.status}</Badge>
          </div>
          <ul className="inquiry-quote-lines">
            {quote.lines.map((line) => (
              <li key={line.key}>
                <span>
                  {line.quantity} × {line.label}
                </span>
                <strong>{rm(line.quantity * line.unitPriceSen)}</strong>
              </li>
            ))}
          </ul>
          <dl className="inquiry-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{rm(quote.subtotalSen)}</dd>
            </div>
            <div>
              <dt>Discount ({quote.discountPct}%)</dt>
              <dd>{rm(quote.discountSen)}</dd>
            </div>
            <div>
              <dt>Illustrative total</dt>
              <dd data-testid="inquiry-quote-total">{rm(quote.totalSen)}</dd>
            </div>
          </dl>
          {quote.approval && (
            <p className="inquiry-notice">
              Review revision {quote.approval.revision}: {quote.approval.note}
            </p>
          )}
          {quote.rejectionNote && (
            <p className="inquiry-notice">
              Revision required: {quote.rejectionNote}
            </p>
          )}
          <p className="inquiry-muted">
            Illustrative rates only. Scope editing and rate assumptions remain
            available in the advanced Automation Hub.
          </p>
          <Link href="/demo/automation-hub" className="text-link">
            Open advanced quotation editing
          </Link>
        </section>
      )}
      {manager && quote && workflow.canReview && (
        <Review
          key={`${quote.id}:${quote.revision}`}
          quote={quote}
          workspace={workspace}
        />
      )}
      {manager && quote && workflow.canPrepare && (
        <section className="demo-panel inquiry-card">
          <h3>Prepare the approved proposal</h3>
          <p>
            Only revision {quote.revision}, with its current approval, can
            advance. This action runs the existing saved preparation task and
            leaves an unsent demonstration copy.
          </p>
          <Button
            disabled={
              busy(workspace) ||
              (!!preparation &&
                preparation.status === "Failed" &&
                preparation.attempts >= 3)
            }
            onClick={() => void prepare()}
          >
            Prepare approved proposal
          </Button>
        </section>
      )}
      {manager &&
        workflow.canPrepare &&
        preparation &&
        preparation.status !== "Succeeded" && (
          <Execution task={preparation} workspace={workspace} kind="proposal" />
        )}
      {workflow.canFollowUp && (
        <p className="inquiry-notice" data-testid="inquiry-ready">
          Approved revision {quote?.revision} is Ready as an unsent demo
          proposal. No email, WhatsApp, production API or customer system has
          received it.
        </p>
      )}
      {manager && (
        <Followups
          inquiryId={inquiryId}
          view={view}
          workspace={workspace}
          ready={workflow.canFollowUp}
        />
      )}
    </div>
  );
}
function Content({
  view,
  workspace,
}: {
  view: AutomationView;
  workspace: LabWorkspace;
}) {
  const role = workspace.packet?.role;
  const [selectedId, setSelectedId] = useState(view.inquiries.at(-1)?.id ?? "");
  const inquiryId = view.inquiries.some((item) => item.id === selectedId)
    ? selectedId
    : (view.inquiries.at(-1)?.id ?? "");
  return (
    <div className="inquiry-app">
      <header className="inquiry-heading">
        <span className="eyebrow">Local demonstration / human decisions</span>
        <h2>A controlled path from inquiry to follow-up.</h2>
        <p>
          This view uses the existing Automation Hub workspace, task queue and
          revision-specific approvals. New fictional inquiries stay separate
          from the website contact brief. All analysis is local and
          deterministic; every proposal remains unsent.
        </p>
        <Link href="/demo/automation-hub" className="text-link">
          Explore the advanced Automation Hub
        </Link>
      </header>
      <Stats
        items={[
          { label: "Saved inquiries", value: view.totals.inquiries },
          { label: "Ready demo proposals", value: view.totals.readyQuotes },
          {
            label: "Approved illustrative value",
            value: rm(view.totals.approvedValueSen),
          },
          {
            label: "Overdue internal reminders",
            value: view.totals.overdueFollowups,
          },
        ]}
      />
      {role === "customer" && (
        <div style={{ marginBottom: 26 }}>
          <Intake workspace={workspace} onSaved={setSelectedId} />
        </div>
      )}
      {role === "viewer" ? (
        <p className="inquiry-notice">
          Viewer receives read-only aggregate totals. Contact records, quotation
          details, task tokens and internal follow-up notes are redacted by the
          server.
        </p>
      ) : (
        <>
          {view.inquiries.length > 0 && (
            <div className="field inquiry-selector">
              <label htmlFor="inquiry-selected">Saved fictional inquiry</label>
              <select
                id="inquiry-selected"
                value={inquiryId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {view.inquiries.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.number} · {item.businessName}
                  </option>
                ))}
              </select>
            </div>
          )}
          {inquiryId ? (
            <Detail
              view={view}
              inquiryId={inquiryId}
              workspace={workspace}
              manager={role === "manager"}
            />
          ) : (
            <>
              <Progress view={view} />
              <Empty>
                {role === "manager"
                  ? "Switch to Customer and save a fictional inquiry to begin the controlled workflow."
                  : "Save a fictional inquiry to see its actual workflow progress."}
              </Empty>
            </>
          )}
        </>
      )}
    </div>
  );
}
export function InquiryWorkspace() {
  const workspace = useLabWorkspace("automation-hub");
  const packet = workspace.packet;
  return (
    <LabShell
      title="Inquiry to reviewed proposal"
      category="Controlled local quotation workflow"
      description="Rehearse a fictional inquiry, explainable qualification, quotation review and internal follow-up with a visible human decision at each approval boundary."
      workspace={workspace}
      roles={["customer", "manager", "viewer"]}
    >
      {packet && (
        <Content
          key={[packet.workspaceId, packet.generation, packet.role].join(":")}
          view={packet.state as AutomationView}
          workspace={workspace}
        />
      )}
    </LabShell>
  );
}
