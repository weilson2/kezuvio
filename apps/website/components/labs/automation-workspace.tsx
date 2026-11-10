"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, Icon, TextArea } from "@kezuvio/ui";
import { Empty, Select, Stats } from "../demos/shared";
import { money } from "@/lib/demo/engine";
import type {
  AutomationView,
  Quote,
  Task,
  PricingRules,
} from "../../../../packages/automation/index";
import { parseSen, quoteTotals } from "../../../../packages/automation/rules";
import { LabShell, useLabWorkspace, type LabWorkspace } from "./platform-shell";
import "./automation.css";

type ViewProps = { view: AutomationView; workspace: LabWorkspace };
type Inquiry = AutomationView["inquiries"][number];
type Area =
  | "new"
  | "mine"
  | "overview"
  | "inquiries"
  | "quotes"
  | "workflow"
  | "followups"
  | "pricing";
const labels: Record<Area, string> = {
  new: "New inquiry",
  mine: "My inquiries",
  overview: "Overview",
  inquiries: "Inquiries",
  quotes: "Quotations",
  workflow: "Workflow",
  followups: "Follow-ups",
  pricing: "Pricing rules",
};
const date = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value));
function localDateInput(value: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
function Status({ value }: { value: string }) {
  return (
    <span
      className={`automation-status automation-status-${value.toLowerCase().replaceAll(" ", "-")}`}
    >
      {value}
    </span>
  );
}
function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="automation-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

function InquiryForm({
  workspace,
  onSaved,
}: {
  workspace: LabWorkspace;
  onSaved: () => void;
}) {
  const [businessName, setBusinessName] = useState("Ruang Sample Studio");
  const [contactName, setContactName] = useState("Sample Customer");
  const [email, setEmail] = useState("customer@example.test");
  const [brief, setBrief] = useState(
    "We need a website with a small shop, inventory tracking and a dashboard for our fictional studio.",
  );
  const [budget, setBudget] = useState("6000.00");
  const [timeline, setTimeline] = useState("8");
  const [error, setError] = useState("");
  const disabled = workspace.busy || workspace.needsRefresh;
  async function submit(event: FormEvent) {
    event.preventDefault();
    let budgetSen: number;
    try {
      budgetSen = parseSen(budget, 10000000, true);
    } catch {
      setError(
        "Enter a sample budget from RM0 to RM100,000, with at most two decimal places.",
      );
      return;
    }
    setError("");
    const result = await workspace.act(
      "inquiry.submit",
      {
        businessName,
        contactName,
        email,
        brief,
        budgetSen,
        timelineWeeks: Number(timeline),
      },
      "Sample inquiry saved. An analysis task is queued for the Manager.",
    );
    if (result) onSaved();
  }
  return (
    <>
      <Heading
        eyebrow="Inquiry / A starting point"
        title="Turn an idea into a reviewable plan."
      >
        Try a fictional project brief. The hub suggests work packages, prepares
        a quotation and keeps every human decision visible.
      </Heading>
      <div className="automation-intake-layout">
        <form
          className="demo-panel automation-form"
          aria-label="New inquiry"
          onSubmit={submit}
        >
          <h3>Your sample project</h3>
          <div className="automation-field-pair">
            <Field
              id="automation-business"
              label="Business name"
              value={businessName}
              required
              maxLength={80}
              onChange={(event) => setBusinessName(event.target.value)}
            />
            <Field
              id="automation-contact"
              label="Contact name"
              value={contactName}
              required
              maxLength={80}
              onChange={(event) => setContactName(event.target.value)}
            />
          </div>
          <Field
            id="automation-email"
            label="Sample email"
            type="email"
            value={email}
            required
            maxLength={120}
            onChange={(event) => setEmail(event.target.value)}
            help="Use a fictional address ending in .test. No email will be sent."
          />
          <TextArea
            id="automation-brief"
            label="Project brief"
            value={brief}
            required
            minLength={20}
            maxLength={2000}
            rows={5}
            onChange={(event) => setBrief(event.target.value)}
          />
          <div className="automation-field-pair">
            <Field
              id="automation-budget"
              label="Budget (RM)"
              type="number"
              min="0"
              max="100000"
              step="0.01"
              value={budget}
              required
              onChange={(event) => setBudget(event.target.value)}
            />
            <Field
              id="automation-timeline"
              label="Timeline (weeks)"
              type="number"
              min="1"
              max="52"
              step="1"
              value={timeline}
              required
              onChange={(event) => setTimeline(event.target.value)}
            />
          </div>
          {error && (
            <p className="automation-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={disabled}>
            Submit sample inquiry
          </Button>
        </form>
        <aside
          className="automation-process"
          aria-label="How this demonstration works"
        >
          <span className="eyebrow">One clear path</span>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Describe the project</h3>
                <p>Your fictional inquiry is saved in this workspace.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>See the reasoning</h3>
                <p>
                  Switch to Manager and run the queued analysis. Local keyword
                  rules explain each suggested work package.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Review before ready</h3>
                <p>
                  Edit the quotation and record human approval before preparing
                  a ready copy.
                </p>
              </div>
            </li>
          </ol>
          <p className="notice">
            This is deterministic AI-style assistance using local rules. No paid
            AI model, email, WhatsApp or external service is called.
          </p>
        </aside>
      </div>
    </>
  );
}

function InquiryCard({
  inquiry,
  view,
  manager,
  onWorkflow,
  onQuotes,
}: {
  inquiry: Inquiry;
  view: AutomationView;
  manager: boolean;
  onWorkflow: () => void;
  onQuotes: () => void;
}) {
  const analysis = view.analyses.find((item) => item.inquiryId === inquiry.id);
  const quote = view.quotes.find((item) => item.inquiryId === inquiry.id);
  const task = view.tasks.find(
    (item) => item.inquiryId === inquiry.id && item.kind === "Analyze",
  );
  return (
    <section
      className="demo-panel automation-inquiry"
      aria-label={`Inquiry ${inquiry.number}`}
    >
      <div className="automation-card-heading">
        <div>
          <span className="eyebrow">Inquiry {inquiry.number}</span>
          <h3>{inquiry.businessName}</h3>
          <small>{date(inquiry.createdAt)} · MYT</small>
        </div>
        <Status value={analysis ? "Analyzed" : task?.status || "Received"} />
      </div>
      <div className="automation-inquiry-layout">
        <div className="automation-brief">
          <h4>Project brief</h4>
          <p>{inquiry.brief}</p>
          <dl className="automation-details">
            <div>
              <dt>Fictional contact</dt>
              <dd>
                {inquiry.contactName}
                <br />
                {inquiry.email}
              </dd>
            </div>
            <div>
              <dt>Budget & timeline</dt>
              <dd>
                {money(inquiry.budgetSen)} · {inquiry.timelineWeeks} weeks
              </dd>
            </div>
          </dl>
        </div>
        <div className="automation-analysis">
          <h4>Suggested requirements</h4>
          {analysis ? (
            <>
              <p>{analysis.summary}</p>
              <ul>
                {analysis.requirements.map((requirement) => (
                  <li key={requirement.key}>
                    <strong>{requirement.label}</strong>
                    <small>{requirement.reason}</small>
                  </li>
                ))}
              </ul>
              <details>
                <summary>Analysis method and limits</summary>
                <p>Rule set: {analysis.rulesVersion}</p>
                {analysis.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </details>
            </>
          ) : (
            <>
              <p>
                The analysis task is {task?.status.toLowerCase() || "waiting"}.
                A Manager starts and completes the local run from Workflow.
              </p>
              {manager && (
                <Button variant="secondary" onClick={onWorkflow}>
                  Open workflow
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {quote && (
        <div className="automation-inquiry-quote">
          <div>
            <span>Quotation · Revision {quote.revision}</span>
            <strong>{money(quote.totalSen)}</strong>
          </div>
          <Status value={quote.status} />
          {manager ? (
            <Button variant="secondary" onClick={onQuotes}>
              Review quotation
            </Button>
          ) : (
            <p>
              {quote.status === "Ready"
                ? "Ready for review. Nothing has been sent."
                : "A Manager reviews the scope and pricing before the quotation is ready."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Inquiries({
  view,
  workspace,
  onWorkflow,
  onQuotes,
}: ViewProps & { onWorkflow: () => void; onQuotes: () => void }) {
  const [query, setQuery] = useState("");
  const manager = workspace.packet?.role === "manager";
  const inquiries = view.inquiries.filter((inquiry) =>
    `${inquiry.businessName} ${inquiry.contactName} ${inquiry.brief}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="automation-heading-row">
        <Heading
          eyebrow={manager ? "Manager / Inquiries" : "Your saved ideas"}
          title={
            manager
              ? "Start with the customer's words."
              : "Your sample inquiries"
          }
        >
          Each analysis explains its suggestions. Scope, price and readiness
          stay subject to human review.
        </Heading>
        <Field
          id="automation-search"
          label="Search inquiries"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {inquiries.length ? (
        <div className="automation-stack">
          {inquiries.map((inquiry) => (
            <InquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              view={view}
              manager={manager}
              onWorkflow={onWorkflow}
              onQuotes={onQuotes}
            />
          ))}
        </div>
      ) : (
        <Empty>
          {query
            ? "No inquiries match your search."
            : "No inquiries yet. Choose Customer and submit a fictional project to begin."}
        </Empty>
      )}
    </>
  );
}

type EditableLine = {
  key: string;
  label: string;
  quantity: string;
  price: string;
};
function QuoteEditor({
  quote,
  workspace,
  onClose,
}: {
  quote: Quote;
  workspace: LabWorkspace;
  onClose: () => void;
}) {
  const [revision] = useState(quote.revision);
  const [lines, setLines] = useState<EditableLine[]>(
    quote.lines.map((line) => ({
      key: line.key,
      label: line.label,
      quantity: String(line.quantity),
      price: (line.unitPriceSen / 100).toFixed(2),
    })),
  );
  const [discount, setDiscount] = useState(String(quote.discountPct));
  const [error, setError] = useState("");
  const disabled = workspace.busy || workspace.needsRefresh;
  const parsed = () =>
    lines.map((line) => ({
      key: line.key,
      label: line.label,
      quantity: Number(line.quantity),
      unitPriceSen: parseSen(line.price),
    }));
  let preview: ReturnType<typeof quoteTotals> | null = null;
  try {
    if (
      lines.every(
        (line) =>
          Number.isInteger(Number(line.quantity)) && Number(line.quantity) >= 1,
      ) &&
      Number.isInteger(Number(discount)) &&
      Number(discount) >= 0 &&
      Number(discount) <= 30
    )
      preview = quoteTotals(parsed(), Number(discount));
  } catch {
    /* Incomplete amount input has no preview. */
  }
  const change = (index: number, field: keyof EditableLine, value: string) =>
    setLines((current) =>
      current.map((line, i) =>
        i === index ? { ...line, [field]: value } : line,
      ),
    );
  async function save(event: FormEvent) {
    event.preventDefault();
    let readyLines;
    try {
      readyLines = parsed();
    } catch {
      setError(
        "Enter each unit price between RM0.01 and RM10,000 with at most two decimal places.",
      );
      return;
    }
    setError("");
    const result = await workspace.act(
      "quote.edit",
      {
        id: quote.id,
        revision,
        lines: readyLines,
        discountPct: Number(discount),
      },
      "Quotation saved as a new draft. Human approval is required again.",
    );
    if (result) onClose();
  }
  return (
    <form
      className="automation-quote-editor"
      aria-label="Edit quotation"
      onSubmit={save}
    >
      <p className="notice">
        Saving creates a new draft and removes previous approval. Any prepared
        copy must be reviewed again.
      </p>
      {revision !== quote.revision && (
        <p className="automation-error">
          This quotation changed in another view. Cancel editing to review its
          latest revision.
        </p>
      )}
      <div className="automation-stack">
        {lines.map((line, index) => (
          <fieldset className="automation-line-editor" key={line.key}>
            <legend>Quotation line {index + 1}</legend>
            <Field
              id={`auto-line-label-${quote.id}-${index}`}
              label={`Item label ${index + 1}`}
              required
              maxLength={100}
              value={line.label}
              onChange={(event) => change(index, "label", event.target.value)}
            />
            <div className="automation-field-pair">
              <Field
                id={`auto-line-qty-${quote.id}-${index}`}
                label={`Quantity ${index + 1}`}
                type="number"
                min="1"
                max="100"
                step="1"
                required
                value={line.quantity}
                onChange={(event) =>
                  change(index, "quantity", event.target.value)
                }
              />
              <Field
                id={`auto-line-price-${quote.id}-${index}`}
                label={`Unit price (RM) ${index + 1}`}
                type="number"
                min="0.01"
                max="10000"
                step="0.01"
                required
                value={line.price}
                onChange={(event) => change(index, "price", event.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              disabled={disabled || lines.length <= 1}
              onClick={() =>
                setLines((current) => current.filter((_, i) => i !== index))
              }
            >
              Remove line {index + 1}
            </Button>
          </fieldset>
        ))}
      </div>
      <Button
        variant="secondary"
        disabled={disabled || lines.length >= 12}
        onClick={() =>
          setLines((current) => [
            ...current,
            {
              key: `custom-${crypto.randomUUID().slice(0, 20)}`,
              label: "Additional sample work",
              quantity: "1",
              price: "100.00",
            },
          ])
        }
      >
        Add quotation line
      </Button>
      <Field
        id={`auto-discount-${quote.id}`}
        label="Discount (%)"
        type="number"
        min="0"
        max="30"
        step="1"
        required
        value={discount}
        onChange={(event) => setDiscount(event.target.value)}
      />
      {preview && (
        <div className="automation-preview">
          <span>Draft total preview</span>
          <strong>{money(preview.totalSen)}</strong>
        </div>
      )}
      {error && (
        <p role="alert" className="automation-error">
          {error}
        </p>
      )}
      <div className="button-row">
        <Button
          type="submit"
          disabled={disabled || revision !== quote.revision}
        >
          Save quotation
        </Button>
        <Button variant="secondary" disabled={disabled} onClick={onClose}>
          Cancel editing
        </Button>
      </div>
    </form>
  );
}

function QuoteCard({
  quote,
  inquiry,
  view,
  workspace,
  onWorkflow,
}: {
  quote: Quote;
  inquiry: Inquiry | undefined;
  view: AutomationView;
  workspace: LabWorkspace;
  onWorkflow: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const disabled = workspace.busy || workspace.needsRefresh;
  const relatedTask = view.tasks.find(
    (task) =>
      task.quoteId === quote.id && task.quoteRevision === quote.revision,
  );
  async function review(type: "quote.approve" | "quote.reject") {
    const result = await workspace.act(
      type,
      { id: quote.id, revision: quote.revision, note },
      type === "quote.approve"
        ? "Human approval recorded for this quotation revision."
        : "Quotation rejected. Revise the scope before proceeding.",
    );
    if (result) setNote("");
  }
  async function prepare() {
    const result = await workspace.act(
      "quote.queue-ready",
      { id: quote.id, revision: quote.revision },
      "Readiness task queued. Run it from Workflow; nothing will be sent.",
    );
    if (result) onWorkflow();
  }
  return (
    <section
      className="demo-panel automation-quote"
      aria-label={`Quotation for inquiry ${inquiry?.number || "unknown"}`}
    >
      <div className="automation-card-heading">
        <div>
          <span className="eyebrow">Inquiry {inquiry?.number} / Quotation</span>
          <h3>{inquiry?.businessName || "Sample project"}</h3>
          <small>
            Revision {quote.revision} · Pricing version{" "}
            {quote.pricingRulesVersion}
          </small>
        </div>
        <Status value={quote.status} />
      </div>
      {editing ? (
        <QuoteEditor
          quote={quote}
          workspace={workspace}
          onClose={() => setEditing(false)}
        />
      ) : (
        <>
          <div
            className="table-wrap"
            role="region"
            aria-label="Scrollable quotation line items"
            tabIndex={0}
          >
            <table>
              <caption className="sr-only">Quotation line items</caption>
              <thead>
                <tr>
                  <th>Work package</th>
                  <th>Quantity</th>
                  <th>Unit price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((line) => (
                  <tr key={line.key}>
                    <th scope="row">{line.label}</th>
                    <td>{line.quantity}</td>
                    <td>{money(line.unitPriceSen)}</td>
                    <td>{money(line.quantity * line.unitPriceSen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="automation-quote-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(quote.subtotalSen)}</dd>
            </div>
            <div>
              <dt>Discount · {quote.discountPct}%</dt>
              <dd>−{money(quote.discountSen)}</dd>
            </div>
            <div>
              <dt>Quotation total</dt>
              <dd data-testid={`automation-quote-total-${inquiry?.number}`}>
                {money(quote.totalSen)}
              </dd>
            </div>
          </dl>
          <p className="notice">
            Assumed demonstration rates, excluding tax. This quotation stays
            inside the demo and is never sent.
          </p>
          {quote.approval && (
            <div className="automation-review-record">
              <strong>Human approval recorded</strong>
              <p>{quote.approval.note}</p>
              <small>{date(quote.approval.at)} · MYT</small>
            </div>
          )}
          {quote.rejectionNote && (
            <div className="automation-review-record">
              <strong>Revision requested</strong>
              <p>{quote.rejectionNote}</p>
            </div>
          )}
          <Button
            variant="secondary"
            disabled={disabled}
            onClick={() => setEditing(true)}
          >
            Edit quotation
          </Button>
          <div className="automation-review-controls">
            <TextArea
              id={`auto-review-${quote.id}`}
              label="Review note"
              rows={2}
              value={note}
              maxLength={300}
              onChange={(event) => setNote(event.target.value)}
            />
            <p className="field-help">
              Record the human decision in at least three characters.
            </p>
            <div className="button-row">
              {["Draft", "Rejected"].includes(quote.status) && (
                <Button
                  disabled={disabled || note.trim().length < 3}
                  onClick={() => void review("quote.approve")}
                >
                  Approve quotation
                </Button>
              )}
              <Button
                variant="secondary"
                disabled={disabled || note.trim().length < 3}
                onClick={() => void review("quote.reject")}
              >
                Reject quotation
              </Button>
            </div>
          </div>
          {quote.status === "Approved" && (
            <div className="automation-ready-action">
              {relatedTask ? (
                <>
                  <p>
                    Readiness task: {relatedTask.status}. Open Workflow to run
                    or retry it.
                  </p>
                  <Button variant="secondary" onClick={onWorkflow}>
                    Open workflow
                  </Button>
                </>
              ) : (
                <>
                  <p>
                    Human approval is recorded. Queue a local task to prepare
                    the ready copy.
                  </p>
                  <Button disabled={disabled} onClick={() => void prepare()}>
                    Prepare ready copy
                  </Button>
                </>
              )}
            </div>
          )}
          {quote.status === "Ready" && (
            <p className="automation-ready-note">
              <Icon name="check" />
              Ready for review. Nothing was sent.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Quotations({
  view,
  workspace,
  onWorkflow,
}: ViewProps & { onWorkflow: () => void }) {
  const [filter, setFilter] = useState("All");
  const quotes = view.quotes.filter(
    (quote) => filter === "All" || quote.status === filter,
  );
  return (
    <>
      <div className="automation-heading-row">
        <Heading
          eyebrow="Manager / Quotations"
          title="A human decision at every handoff."
        >
          Review the suggested scope, adjust the draft and record approval
          before preparing a ready copy.
        </Heading>
        <Select
          id="automation-quote-filter"
          label="Filter quotations"
          value={filter}
          onChange={setFilter}
        >
          {["All", "Draft", "Rejected", "Approved", "Ready"].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </Select>
      </div>
      {quotes.length ? (
        <div className="automation-stack">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              inquiry={view.inquiries.find(
                (inquiry) => inquiry.id === quote.inquiryId,
              )}
              view={view}
              workspace={workspace}
              onWorkflow={onWorkflow}
            />
          ))}
        </div>
      ) : (
        <Empty>
          {filter === "All"
            ? "No quotations yet. Complete an analysis task in Workflow to create a draft."
            : "No quotations match this status."}
        </Empty>
      )}
    </>
  );
}

function TaskCard({
  task,
  inquiry,
  workspace,
}: {
  task: Task;
  inquiry: Inquiry | undefined;
  workspace: LabWorkspace;
}) {
  const [fail, setFail] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (task.status !== "Running") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [task.status]);
  const expired = !!task.leaseUntil && Date.parse(task.leaseUntil) <= now;
  const disabled = workspace.busy || workspace.needsRefresh;
  async function finish() {
    await workspace.act(
      "task.finish",
      { id: task.id, runId: task.runId, fail },
      fail
        ? "The failed run was recorded. No effects were applied."
        : "Run completed. Saved results are ready to inspect.",
    );
  }
  return (
    <section
      className="demo-panel automation-task"
      aria-label={`${task.kind} task for inquiry ${inquiry?.number || "unknown"}`}
      data-testid={`automation-task-${task.id}`}
    >
      <div className="automation-card-heading">
        <div>
          <span className="eyebrow">
            Inquiry {inquiry?.number} · Attempt {task.attempts} of 3
          </span>
          <h3>
            {task.kind === "Analyze"
              ? "Analyze inquiry"
              : "Prepare approved quotation"}
          </h3>
          <p>{inquiry?.businessName}</p>
        </div>
        <Status value={task.status} />
      </div>
      <p>
        {task.kind === "Analyze"
          ? "Apply local keyword rules and save one analysis with a draft quotation."
          : `Prepare the approved quotation, revision ${task.quoteRevision}. Nothing is sent.`}
      </p>
      {task.error && <p className="automation-error">{task.error}</p>}
      {task.status === "Queued" && (
        <Button
          disabled={disabled}
          onClick={() =>
            void workspace.act(
              "task.start",
              { id: task.id },
              "Task started. Complete the local run to save its result.",
            )
          }
        >
          Start task
        </Button>
      )}
      {task.status === "Running" && (
        <div className="automation-task-controls">
          {expired ? (
            <>
              <p>The run window expired. Recover it, then retry explicitly.</p>
              <Button
                disabled={disabled}
                onClick={() =>
                  void workspace.act(
                    "task.recover",
                    { id: task.id },
                    "Interrupted run recovered. It can now be retried.",
                  )
                }
              >
                Recover interrupted run
              </Button>
            </>
          ) : (
            <>
              <p>
                Running · complete within{" "}
                {Math.max(
                  0,
                  Math.ceil((Date.parse(task.leaseUntil || "") - now) / 1000),
                )}{" "}
                seconds, or recover the interrupted run after it expires.
              </p>
              <label className="automation-checkbox">
                <input
                  type="checkbox"
                  checked={fail}
                  onChange={(event) => setFail(event.target.checked)}
                  disabled={disabled}
                />
                Simulate failed run
              </label>
              <Button disabled={disabled} onClick={() => void finish()}>
                Complete run
              </Button>
            </>
          )}
        </div>
      )}
      {task.status === "Failed" &&
        (task.attempts < 3 ? (
          <Button
            variant="secondary"
            disabled={disabled}
            onClick={() =>
              void workspace.act(
                "task.retry",
                { id: task.id },
                "Retry queued. Start the task when ready.",
              )
            }
          >
            Retry task
          </Button>
        ) : (
          <p className="notice">
            The three-attempt demo limit has been reached.
          </p>
        ))}
      {task.status === "Succeeded" && (
        <p className="automation-ready-note">
          <Icon name="check" />
          {task.kind === "Analyze"
            ? "Analysis and draft quotation saved."
            : "Ready copy prepared. Nothing was sent."}
        </p>
      )}
    </section>
  );
}

function Workflow({ view, workspace }: ViewProps) {
  const [filter, setFilter] = useState("All");
  const tasks = view.tasks.filter(
    (task) => filter === "All" || task.status === filter,
  );
  const history = view.history || [];
  return (
    <>
      <div className="automation-heading-row">
        <Heading
          eyebrow="Manager / Workflow"
          title="Run it. Inspect it. Recover it."
        >
          You control each local run. Start and complete tasks to save actual
          results; interrupted runs can be recovered after their run window
          expires.
        </Heading>
        <Select
          id="automation-task-filter"
          label="Filter tasks"
          value={filter}
          onChange={setFilter}
        >
          {["All", "Queued", "Running", "Succeeded", "Failed"].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </Select>
      </div>
      <Stats
        items={[
          { label: "Queued", value: view.totals.queued },
          { label: "Running", value: view.totals.running },
          { label: "Failed", value: view.totals.failed },
        ]}
      />
      {tasks.length ? (
        <div className="automation-task-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              inquiry={view.inquiries.find(
                (inquiry) => inquiry.id === task.inquiryId,
              )}
              workspace={workspace}
            />
          ))}
        </div>
      ) : (
        <Empty>
          {filter === "All"
            ? "No tasks yet. Submit a sample inquiry as Customer to queue an analysis."
            : "No tasks match this status."}
        </Empty>
      )}
      <section
        className="demo-panel automation-history"
        aria-label="Execution and decision history"
      >
        <h3>Execution and decision history</h3>
        {history.length ? (
          <ol>
            {history.map((entry) => (
              <li key={entry.id}>
                <span className="automation-history-dot" aria-hidden="true" />
                <div>
                  <strong>{entry.event}</strong>
                  <p>{entry.note}</p>
                  <small>
                    {date(entry.at)} MYT
                    {entry.attempt ? ` · Attempt ${entry.attempt}` : ""}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <Empty>Runs and human decisions will appear here as you work.</Empty>
        )}
      </section>
    </>
  );
}

function FollowupForm({ view, workspace }: ViewProps) {
  const [inquiryId, setInquiryId] = useState(view.inquiries[0]?.id || "");
  const [due, setDue] = useState(() => localDateInput(Date.now() + 86400000));
  const [note, setNote] = useState(
    "Review the fictional customer's revised scope.",
  );
  const [error, setError] = useState("");
  const disabled = workspace.busy || workspace.needsRefresh;
  async function submit(event: FormEvent) {
    event.preventDefault();
    let dueAt: string;
    try {
      dueAt = new Date(`${due}:00+08:00`).toISOString();
    } catch {
      setError("Choose a valid date and time in MYT.");
      return;
    }
    setError("");
    await workspace.act(
      "followup.create",
      { inquiryId, dueAt, note },
      "Internal follow-up saved. No external message is scheduled.",
    );
  }
  return (
    <form
      className="demo-panel automation-form"
      aria-label="Schedule follow-up"
      onSubmit={submit}
    >
      <h3>Schedule an internal follow-up</h3>
      <Select
        id="automation-followup-inquiry"
        label="Inquiry"
        value={inquiryId}
        onChange={setInquiryId}
        disabled={disabled}
      >
        {view.inquiries.map((inquiry) => (
          <option value={inquiry.id} key={inquiry.id}>
            Inquiry {inquiry.number} · {inquiry.businessName}
          </option>
        ))}
      </Select>
      <Field
        id="automation-due"
        label="Due (MYT)"
        type="datetime-local"
        required
        value={due}
        onChange={(event) => setDue(event.target.value)}
        help="Asia/Kuala_Lumpur time. Past dates can demonstrate overdue reminders."
      />
      <TextArea
        id="automation-followup-note"
        label="Follow-up note"
        rows={3}
        value={note}
        required
        maxLength={300}
        onChange={(event) => setNote(event.target.value)}
      />
      {error && (
        <p role="alert" className="automation-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={disabled || !inquiryId}>
        Schedule follow-up
      </Button>
      <p className="field-help">
        This is an internal reminder. It does not schedule email, WhatsApp or
        any other message.
      </p>
    </form>
  );
}

function FollowupCard({
  followup,
  inquiry,
  workspace,
}: {
  followup: AutomationView["followups"][number];
  inquiry: Inquiry | undefined;
  workspace: LabWorkspace;
}) {
  const [note, setNote] = useState("");
  const disabled = workspace.busy || workspace.needsRefresh;
  async function complete(event: FormEvent) {
    event.preventDefault();
    await workspace.act(
      "followup.complete",
      { id: followup.id, note },
      "Follow-up completed manually. Nothing was sent.",
    );
  }
  return (
    <section
      className="demo-panel automation-followup"
      aria-label={`Follow-up for inquiry ${inquiry?.number}`}
    >
      <div className="automation-card-heading">
        <div>
          <span className="eyebrow">Inquiry {inquiry?.number}</span>
          <h3>{inquiry?.businessName}</h3>
          <small>Due {date(followup.dueAt)} MYT</small>
        </div>
        <Status value={followup.overdue ? "Overdue" : followup.status} />
      </div>
      <p>{followup.note}</p>
      {followup.status === "Completed" ? (
        <div className="automation-review-record">
          <strong>Completed manually</strong>
          <p>{followup.completionNote}</p>
          <small>
            {followup.completedAt && date(followup.completedAt)} MYT
          </small>
        </div>
      ) : (
        <form className="automation-form" onSubmit={complete}>
          <Field
            id={`automation-complete-${followup.id}`}
            label="Completion note"
            required
            maxLength={300}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <Button type="submit" disabled={disabled}>
            Complete follow-up
          </Button>
        </form>
      )}
    </section>
  );
}

function Followups({ view, workspace }: ViewProps) {
  const [filter, setFilter] = useState("All");
  const followups = view.followups.filter(
    (item) =>
      filter === "All" ||
      (filter === "Overdue" ? item.overdue : item.status === filter),
  );
  return (
    <>
      <div className="automation-heading-row">
        <Heading
          eyebrow="Manager / Follow-ups"
          title="Keep the next conversation in sight."
        >
          Track internal reminders and record completion. All dates are shown in
          Malaysia time.
        </Heading>
        <Select
          id="automation-followup-filter"
          label="Filter follow-ups"
          value={filter}
          onChange={setFilter}
        >
          {["All", "Scheduled", "Overdue", "Completed"].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </Select>
      </div>
      {view.inquiries.length ? (
        <div className="automation-followup-layout">
          <FollowupForm view={view} workspace={workspace} />
          <div className="automation-stack">
            {followups.length ? (
              followups.map((followup) => (
                <FollowupCard
                  key={followup.id}
                  followup={followup}
                  inquiry={view.inquiries.find(
                    (inquiry) => inquiry.id === followup.inquiryId,
                  )}
                  workspace={workspace}
                />
              ))
            ) : (
              <Empty>
                No follow-ups match this view. Schedule an internal reminder to
                begin.
              </Empty>
            )}
          </div>
        </div>
      ) : (
        <Empty>
          Submit an inquiry first, then return here to schedule its follow-up.
        </Empty>
      )}
    </>
  );
}

function Pricing({
  rules,
  workspace,
}: {
  rules: PricingRules;
  workspace: LabWorkspace;
}) {
  const [version, setVersion] = useState(rules.version);
  const [rates, setRates] = useState(() =>
    Object.fromEntries(
      rules.rates.map((rate) => [
        rate.key,
        (rate.unitPriceSen / 100).toFixed(2),
      ]),
    ),
  );
  const [error, setError] = useState("");
  const disabled = workspace.busy || workspace.needsRefresh;
  async function save(event: FormEvent) {
    event.preventDefault();
    let parsed;
    try {
      parsed = rules.rates.map((rate) => ({
        key: rate.key,
        unitPriceSen: parseSen(rates[rate.key]),
      }));
    } catch {
      setError(
        "Enter each rate between RM0.01 and RM10,000 with at most two decimal places.",
      );
      return;
    }
    setError("");
    const result = await workspace.act(
      "rules.update",
      { version, rates: parsed },
      "Pricing rules saved. Existing quotations retain their agreed prices.",
    );
    if (result) setVersion((result.state as AutomationView).rules!.version);
  }
  return (
    <>
      <Heading
        eyebrow="Manager / Pricing assumptions"
        title="Make every rate explicit."
      >
        These configurable sample rates price future analysis results. Existing
        quotations retain their saved line items and totals.
      </Heading>
      <form
        className="demo-panel automation-form automation-pricing"
        aria-label="Pricing rules"
        onSubmit={save}
      >
        <div className="automation-card-heading">
          <h3>Sample work-package rates</h3>
          <span className="badge">Version {rules.version}</span>
        </div>
        {version !== rules.version && (
          <div className="automation-review-record">
            <p>
              Pricing changed in another view. Load its latest version before
              editing.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setVersion(rules.version);
                setRates(
                  Object.fromEntries(
                    rules.rates.map((rate) => [
                      rate.key,
                      (rate.unitPriceSen / 100).toFixed(2),
                    ]),
                  ),
                );
              }}
            >
              Load latest rates
            </Button>
          </div>
        )}
        <div className="automation-rate-grid">
          {rules.rates.map((rate) => (
            <Field
              key={rate.key}
              id={`automation-rate-${rate.key}`}
              label={`${rate.label} rate (RM)`}
              type="number"
              min="0.01"
              max="10000"
              step="0.01"
              required
              value={rates[rate.key]}
              onChange={(event) =>
                setRates((current) => ({
                  ...current,
                  [rate.key]: event.target.value,
                }))
              }
            />
          ))}
        </div>
        {error && (
          <p role="alert" className="automation-error">
            {error}
          </p>
        )}
        <Button type="submit" disabled={disabled || version !== rules.version}>
          Save pricing rules
        </Button>
        <p className="notice">
          Rates are fictional assumptions for this demonstration, not service
          offers or market quotations. Discounts round to the nearest sen, with
          half-sen ties rounded up.
        </p>
      </form>
    </>
  );
}

function Overview({
  view,
  onWorkflow,
  manager,
}: {
  view: AutomationView;
  onWorkflow: () => void;
  manager: boolean;
}) {
  const total = view.totals;
  return (
    <>
      <Heading
        eyebrow="Automation / Overview"
        title="From first inquiry to considered response."
      >
        Follow saved inquiries, review decisions and local runs in one
        workspace. Every ready quotation remains a demonstration.
      </Heading>
      <div className="automation-featured">
        <div>
          <span>Approved quotation value</span>
          <strong data-testid="automation-approved-value">
            {money(total.approvedValueSen)}
          </strong>
          <small>Approved and ready drafts · no money collected</small>
        </div>
        <div>
          <span>Ready for review</span>
          <strong data-testid="automation-ready-count">
            {total.readyQuotes}
          </strong>
          <small>Nothing sent externally</small>
        </div>
      </div>
      <Stats
        items={[
          { label: "Inquiries", value: total.inquiries },
          { label: "Queued tasks", value: total.queued },
          { label: "Running tasks", value: total.running },
          { label: "Failed tasks", value: total.failed },
          { label: "Overdue follow-ups", value: total.overdueFollowups },
        ]}
      />
      <section className="demo-panel automation-overview-note">
        <div>
          <h3>Human review stays in the loop.</h3>
          <p>
            Local rules suggest a scope. A Manager reviews the quote, records
            approval, and explicitly runs the preparation task. A queued or
            running task is saved so you can inspect and recover it.
          </p>
        </div>
        {manager && <Button onClick={onWorkflow}>Open workflow</Button>}
      </section>
    </>
  );
}

function AutomationContent({ view, workspace }: ViewProps) {
  const role = workspace.packet!.role;
  const areas: Area[] =
    role === "customer"
      ? ["new", "mine"]
      : role === "manager"
        ? [
            "overview",
            "inquiries",
            "quotes",
            "workflow",
            "followups",
            "pricing",
          ]
        : ["overview"];
  const [area, setArea] = useState<Area>(areas[0]);
  const selected = areas.includes(area) ? area : areas[0];
  const workflow = () => setArea("workflow");
  return (
    <div className="automation-app">
      <div
        className="demo-tablist automation-nav"
        role="group"
        aria-label="Automation views"
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
      {selected === "new" && (
        <InquiryForm workspace={workspace} onSaved={() => setArea("mine")} />
      )}
      {(selected === "mine" || selected === "inquiries") && (
        <Inquiries
          view={view}
          workspace={workspace}
          onWorkflow={workflow}
          onQuotes={() => setArea("quotes")}
        />
      )}
      {selected === "overview" && (
        <Overview
          view={view}
          manager={role === "manager"}
          onWorkflow={workflow}
        />
      )}
      {selected === "quotes" && (
        <Quotations view={view} workspace={workspace} onWorkflow={workflow} />
      )}
      {selected === "workflow" && (
        <Workflow view={view} workspace={workspace} />
      )}
      {selected === "followups" && (
        <Followups view={view} workspace={workspace} />
      )}
      {selected === "pricing" && view.rules && (
        <Pricing rules={view.rules} workspace={workspace} />
      )}
    </div>
  );
}

export function AutomationWorkspace() {
  const workspace = useLabWorkspace("automation-hub");
  const packet = workspace.packet;
  return (
    <LabShell
      title="Automation Hub"
      category="Inquiry & workflow studio"
      description="Explore explainable local analysis, editable quotations and human-approved workflows. Fictional inquiries in, reviewable sample work out."
      workspace={workspace}
      roles={["customer", "manager", "viewer"]}
    >
      {packet && (
        <AutomationContent
          key={`${packet.workspaceId}:${packet.generation}:${packet.role}`}
          view={packet.state as AutomationView}
          workspace={workspace}
        />
      )}
    </LabShell>
  );
}
