import { randomUUID } from "node:crypto";
import {
  LabsError,
  assertRole,
  integer,
  type ProductModule,
  type Actor,
} from "../demo-platform/index.ts";
import {
  analyzeInquiry,
  quoteTotals,
  rateDefinitions,
  type AnalysisResult,
  type QuoteLine,
} from "./rules.ts";
export type { QuoteLine } from "./rules.ts";
export type Inquiry = {
  id: string;
  number: number;
  customerId: string;
  businessName: string;
  contactName: string;
  email: string;
  brief: string;
  budgetSen: number;
  timelineWeeks: number;
  createdAt: string;
};
export type Analysis = AnalysisResult & { id: string; inquiryId: string };
export type Quote = {
  id: string;
  inquiryId: string;
  revision: number;
  status: "Draft" | "Rejected" | "Approved" | "Ready";
  lines: QuoteLine[];
  discountPct: number;
  subtotalSen: number;
  discountSen: number;
  totalSen: number;
  pricingRulesVersion: number;
  approval: { revision: number; note: string; at: string } | null;
  rejectionNote: string;
  updatedAt: string;
};
export type Task = {
  id: string;
  inquiryId: string;
  quoteId: string | null;
  quoteRevision: number | null;
  kind: "Analyze" | "Prepare ready";
  status: "Queued" | "Running" | "Succeeded" | "Failed";
  attempts: number;
  runId: string | null;
  leaseUntil: string | null;
  error: string;
  createdAt: string;
};
export type Followup = {
  id: string;
  inquiryId: string;
  dueAt: string;
  note: string;
  status: "Scheduled" | "Completed";
  completedAt: string | null;
  completionNote: string;
};
export type PricingRules = {
  version: number;
  rates: { key: string; label: string; unitPriceSen: number }[];
};
export type History = {
  id: string;
  taskId: string | null;
  subjectId: string;
  event: string;
  attempt: number;
  at: string;
  note: string;
};
export type AutomationState = {
  inquiries: Inquiry[];
  analyses: Analysis[];
  quotes: Quote[];
  tasks: Task[];
  followups: Followup[];
  rules: PricingRules;
  history: History[];
  nextInquiry: number;
};
export type AutomationTotals = {
  inquiries: number;
  queued: number;
  running: number;
  failed: number;
  readyQuotes: number;
  approvedValueSen: number;
  overdueFollowups: number;
};
export type AutomationView = {
  inquiries: Omit<Inquiry, "customerId">[];
  analyses: Analysis[];
  quotes: Quote[];
  tasks: Task[];
  followups: (Followup & { overdue: boolean })[];
  rules?: PricingRules;
  history?: History[];
  totals: AutomationTotals;
};
export const RUN_LEASE_MS = 60000;
export const seedAutomation = (): AutomationState => ({
  inquiries: [],
  analyses: [],
  quotes: [],
  tasks: [],
  followups: [],
  history: [],
  nextInquiry: 1,
  rules: { version: 1, rates: rateDefinitions.map((rate) => ({ ...rate })) },
});
function keys(args: Record<string, unknown>, expected: string[]) {
  if (
    Object.keys(args).length !== expected.length ||
    expected.some((key) => !Object.hasOwn(args, key))
  )
    throw new LabsError(400, "Unexpected or missing action arguments.");
}
function text(value: unknown, label: string, max: number, min = 1) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.length > max
  )
    throw new LabsError(400, `${label} must contain ${min}–${max} characters.`);
  return value.trim();
}
function id<T extends { id: string }>(
  rows: T[],
  value: unknown,
  label: string,
): T {
  const found = rows.find((row) => row.id === text(value, `${label} ID`, 80));
  if (!found) throw new LabsError(404, `${label} not found in this workspace.`);
  return found;
}
function revision(quote: Quote, value: unknown) {
  if (integer(value, "Quote revision", 1) !== quote.revision)
    throw new LabsError(
      409,
      "The quotation changed. Refresh before continuing.",
    );
}
function lines(value: unknown): QuoteLine[] {
  if (!Array.isArray(value) || !value.length || value.length > 12)
    throw new LabsError(400, "Use 1–12 quotation lines.");
  const result = value.map((line) => {
    if (!line || typeof line !== "object" || Array.isArray(line))
      throw new LabsError(400, "Invalid quotation line.");
    keys(line, ["key", "label", "quantity", "unitPriceSen"]);
    return {
      key: text(line.key, "Line key", 40),
      label: text(line.label, "Line label", 100),
      quantity: integer(line.quantity, "Quantity", 1, 100),
      unitPriceSen: integer(line.unitPriceSen, "Unit price in sen", 1, 1000000),
    };
  });
  if (new Set(result.map((line) => line.key)).size !== result.length)
    throw new LabsError(400, "Quotation line keys must be unique.");
  return result;
}
function record(
  state: AutomationState,
  event: string,
  subjectId: string,
  note: string,
  at: string,
  task?: Task,
) {
  if (state.history.length >= 500)
    throw new LabsError(
      429,
      "Demo history limit reached. Reset this workspace.",
    );
  state.history.unshift({
    id: randomUUID(),
    taskId: task?.id ?? null,
    subjectId,
    event,
    note,
    at,
    attempt: task?.attempts ?? 0,
  });
}
function queue(
  state: AutomationState,
  inquiryId: string,
  kind: Task["kind"],
  at: string,
  quote?: Quote,
) {
  if (state.tasks.length >= 100)
    throw new LabsError(429, "Demo task limit reached. Reset this workspace.");
  const task: Task = {
    id: randomUUID(),
    inquiryId,
    quoteId: quote?.id ?? null,
    quoteRevision: quote?.revision ?? null,
    kind,
    status: "Queued",
    attempts: 0,
    runId: null,
    leaseUntil: null,
    error: "",
    createdAt: at,
  };
  state.tasks.unshift(task);
  record(
    state,
    "Task queued",
    task.id,
    `${kind}: awaiting an explicit demo run.`,
    at,
    task,
  );
  return task;
}
function approved(state: AutomationState, task: Task) {
  const quote = state.quotes.find((q) => q.id === task.quoteId);
  return quote &&
    quote.status === "Approved" &&
    quote.revision === task.quoteRevision &&
    quote.approval?.revision === quote.revision
    ? quote
    : null;
}
export function automationTotals(
  state: AutomationState,
  now = Date.now(),
): AutomationTotals {
  return {
    inquiries: state.inquiries.length,
    queued: state.tasks.filter((t) => t.status === "Queued").length,
    running: state.tasks.filter((t) => t.status === "Running").length,
    failed: state.tasks.filter((t) => t.status === "Failed").length,
    readyQuotes: state.quotes.filter((q) => q.status === "Ready").length,
    approvedValueSen: state.quotes
      .filter((q) => q.status === "Approved" || q.status === "Ready")
      .reduce((sum, q) => sum + q.totalSen, 0),
    overdueFollowups: state.followups.filter(
      (f) => f.status === "Scheduled" && Date.parse(f.dueAt) < now,
    ).length,
  };
}
export function createAutomationModule(
  clock: () => number = Date.now,
): ProductModule<AutomationState> {
  return {
    id: "automation-hub",
    seed: seedAutomation,
    reduce(source, action, actor) {
      const state = structuredClone(source),
        args = action.args,
        now = clock(),
        at = new Date(now).toISOString();
      const manager = () => assertRole(actor.role, ["manager"]);
      switch (action.type) {
        case "inquiry.submit": {
          assertRole(actor.role, ["customer"]);
          keys(args, [
            "businessName",
            "contactName",
            "email",
            "brief",
            "budgetSen",
            "timelineWeeks",
          ]);
          if (state.inquiries.length >= 25)
            throw new LabsError(
              429,
              "Demo inquiry limit reached. Reset this workspace.",
            );
          const email = text(args.email, "Fictional email", 120).toLowerCase();
          if (!/^[a-z0-9._+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.test$/.test(email))
            throw new LabsError(
              400,
              "Use a fictional address ending in .test, such as customer@example.test.",
            );
          const inquiry: Inquiry = {
            id: randomUUID(),
            number: state.nextInquiry++,
            customerId: actor.customerId,
            businessName: text(args.businessName, "Fictional business", 80),
            contactName: text(args.contactName, "Fictional contact", 80),
            email,
            brief: text(args.brief, "Project brief", 2000, 20),
            budgetSen: integer(args.budgetSen, "Budget in sen", 0, 10000000),
            timelineWeeks: integer(
              args.timelineWeeks,
              "Timeline in weeks",
              1,
              52,
            ),
            createdAt: at,
          };
          state.inquiries.unshift(inquiry);
          record(
            state,
            "Inquiry received",
            inquiry.id,
            "Fictional inquiry saved; no message sent.",
            at,
          );
          queue(state, inquiry.id, "Analyze", at);
          break;
        }
        case "rules.update": {
          manager();
          keys(args, ["version", "rates"]);
          if (
            integer(args.version, "Pricing version", 1) !== state.rules.version
          )
            throw new LabsError(
              409,
              "Pricing rules changed. Refresh before saving.",
            );
          if (
            !Array.isArray(args.rates) ||
            args.rates.length !== rateDefinitions.length
          )
            throw new LabsError(400, "Supply each configured rate once.");
          const rates = args.rates.map((rate) => {
            if (!rate || typeof rate !== "object" || Array.isArray(rate))
              throw new LabsError(400, "Invalid pricing rule.");
            keys(rate, ["key", "unitPriceSen"]);
            const def = rateDefinitions.find((item) => item.key === rate.key);
            if (!def) throw new LabsError(400, "Unknown pricing rule.");
            return {
              key: def.key,
              label: def.label,
              unitPriceSen: integer(
                rate.unitPriceSen,
                "Rate in sen",
                1,
                1000000,
              ),
            };
          });
          if (
            new Set(rates.map((rate) => rate.key)).size !==
            rateDefinitions.length
          )
            throw new LabsError(400, "Supply each configured rate once.");
          state.rules = {
            version: state.rules.version + 1,
            rates: rateDefinitions.map((def) =>
              rates.find((rate) => rate.key === def.key)!,
            ),
          };
          record(
            state,
            "Pricing rules updated",
            "pricing",
            `Version ${state.rules.version}; existing quotations unchanged.`,
            at,
          );
          break;
        }
        case "quote.edit": {
          manager();
          keys(args, ["id", "revision", "lines", "discountPct"]);
          const q = id(state.quotes, args.id, "Quotation");
          revision(q, args.revision);
          q.lines = lines(args.lines);
          q.discountPct = integer(
            args.discountPct,
            "Discount percentage",
            0,
            30,
          );
          Object.assign(q, quoteTotals(q.lines, q.discountPct));
          q.revision++;
          q.status = "Draft";
          q.approval = null;
          q.rejectionNote = "";
          q.updatedAt = at;
          record(
            state,
            "Quotation edited",
            q.id,
            `Revision ${q.revision}; prior approval invalidated.`,
            at,
          );
          break;
        }
        case "quote.approve":
        case "quote.reject": {
          manager();
          keys(args, ["id", "revision", "note"]);
          const q = id(state.quotes, args.id, "Quotation");
          revision(q, args.revision);
          const note = text(args.note, "Human review note", 300, 3);
          if (
            action.type === "quote.approve" &&
            !["Draft", "Rejected"].includes(q.status)
          )
            throw new LabsError(
              409,
              "Only a draft or rejected quotation can be approved.",
            );
          q.revision++;
          q.updatedAt = at;
          if (action.type === "quote.approve") {
            q.status = "Approved";
            q.approval = { revision: q.revision, note, at };
            q.rejectionNote = "";
          } else {
            q.status = "Rejected";
            q.approval = null;
            q.rejectionNote = note;
          }
          record(
            state,
            action.type === "quote.approve"
              ? "Quotation approved"
              : "Quotation rejected",
            q.id,
            `Revision ${q.revision}: ${note}`,
            at,
          );
          break;
        }
        case "quote.queue-ready": {
          manager();
          keys(args, ["id", "revision"]);
          const q = id(state.quotes, args.id, "Quotation");
          revision(q, args.revision);
          if (q.status !== "Approved" || q.approval?.revision !== q.revision)
            throw new LabsError(
              409,
              "Human approval of this quotation revision is required first.",
            );
          if (
            state.tasks.some(
              (t) => t.quoteId === q.id && t.quoteRevision === q.revision,
            )
          )
            throw new LabsError(
              409,
              "This revision already has a readiness task. Use its retry controls if needed.",
            );
          queue(state, q.inquiryId, "Prepare ready", at, q);
          break;
        }
        case "task.start": {
          manager();
          keys(args, ["id"]);
          const t = id(state.tasks, args.id, "Task");
          if (t.status !== "Queued" || t.attempts >= 3)
            throw new LabsError(
              409,
              "Only a queued task with attempts remaining can start.",
            );
          t.status = "Running";
          t.attempts++;
          t.runId = randomUUID();
          t.leaseUntil = new Date(now + RUN_LEASE_MS).toISOString();
          t.error = "";
          record(
            state,
            "Run started",
            t.id,
            "Explicit local simulation; no external service called.",
            at,
            t,
          );
          break;
        }
        case "task.finish": {
          manager();
          keys(args, ["id", "runId", "fail"]);
          const t = id(state.tasks, args.id, "Task");
          if (typeof args.fail !== "boolean")
            throw new LabsError(
              400,
              "Failure simulation must be true or false.",
            );
          if (t.status !== "Running" || !t.runId || args.runId !== t.runId)
            throw new LabsError(
              409,
              "This run is no longer active. Refresh the task.",
            );
          if (!t.leaseUntil || Date.parse(t.leaseUntil) <= now)
            throw new LabsError(
              409,
              "Run lease expired. Recover it before retrying.",
            );
          let failure = args.fail
            ? "Simulated execution failure. No effects applied."
            : "";
          if (!failure && t.kind === "Prepare ready" && !approved(state, t))
            failure =
              "Quotation changed or approval was revoked. Review and queue the new revision.";
          if (!failure && t.kind === "Analyze") {
            const inquiry = id(state.inquiries, t.inquiryId, "Inquiry");
            if (
              state.analyses.some((a) => a.inquiryId === inquiry.id) ||
              state.quotes.some((q) => q.inquiryId === inquiry.id)
            )
              failure = "This inquiry already has an analysis and quotation.";
            else {
              const analysis = {
                id: inquiry.id,
                inquiryId: inquiry.id,
                ...analyzeInquiry(inquiry.brief),
              };
              const quoteLines = analysis.requirements.map((req) => ({
                key: req.key,
                label: req.label,
                quantity: req.quantity,
                unitPriceSen: state.rules.rates.find(
                  (rate) => rate.key === req.key,
                )!.unitPriceSen,
              }));
              state.analyses.unshift(analysis);
              state.quotes.unshift({
                id: randomUUID(),
                inquiryId: inquiry.id,
                revision: 1,
                status: "Draft",
                lines: quoteLines,
                discountPct: 0,
                ...quoteTotals(quoteLines, 0),
                pricingRulesVersion: state.rules.version,
                approval: null,
                rejectionNote: "",
                updatedAt: at,
              });
            }
          } else if (!failure && t.kind === "Prepare ready") {
            const q = approved(state, t)!;
            q.status = "Ready";
            q.updatedAt = at;
          }
          t.status = failure ? "Failed" : "Succeeded";
          t.error = failure;
          t.runId = null;
          t.leaseUntil = null;
          record(
            state,
            failure ? "Run failed" : "Run succeeded",
            t.id,
            failure ||
              (t.kind === "Analyze"
                ? "Deterministic analysis and draft quotation saved."
                : "Approved quotation ready for review. Nothing was sent."),
            at,
            t,
          );
          break;
        }
        case "task.recover": {
          manager();
          keys(args, ["id"]);
          const t = id(state.tasks, args.id, "Task");
          if (
            t.status !== "Running" ||
            !t.leaseUntil ||
            Date.parse(t.leaseUntil) > now
          )
            throw new LabsError(
              409,
              "Only an expired running task can be recovered.",
            );
          t.status = "Failed";
          t.error = "Run lease expired. Retry explicitly.";
          t.runId = null;
          t.leaseUntil = null;
          record(state, "Run recovered", t.id, t.error, at, t);
          break;
        }
        case "task.retry": {
          manager();
          keys(args, ["id"]);
          const t = id(state.tasks, args.id, "Task");
          if (t.status !== "Failed" || t.attempts >= 3)
            throw new LabsError(
              409,
              "Only failed tasks with fewer than three attempts can retry.",
            );
          if (t.kind === "Prepare ready" && !approved(state, t))
            throw new LabsError(
              409,
              "Queue the newly approved quotation revision instead.",
            );
          t.status = "Queued";
          t.error = "";
          record(
            state,
            "Retry queued",
            t.id,
            "Awaiting explicit start; no effects applied.",
            at,
            t,
          );
          break;
        }
        case "followup.create": {
          manager();
          keys(args, ["inquiryId", "dueAt", "note"]);
          const inquiry = id(state.inquiries, args.inquiryId, "Inquiry");
          if (state.followups.length >= 100)
            throw new LabsError(
              429,
              "Demo follow-up limit reached. Reset this workspace.",
            );
          const dueAt = text(args.dueAt, "Due date", 30),
            date = Date.parse(dueAt);
          if (
            !Number.isFinite(date) ||
            new Date(date).toISOString() !== dueAt ||
            date < now - 366 * 86400000 ||
            date > now + 366 * 86400000
          )
            throw new LabsError(
              400,
              "Choose an ISO due date within one year of today.",
            );
          const f: Followup = {
            id: randomUUID(),
            inquiryId: inquiry.id,
            dueAt,
            note: text(args.note, "Follow-up note", 300),
            status: "Scheduled",
            completedAt: null,
            completionNote: "",
          };
          state.followups.unshift(f);
          record(
            state,
            "Follow-up scheduled",
            f.id,
            "Internal fictional reminder only; no message scheduled.",
            at,
          );
          break;
        }
        case "followup.complete": {
          manager();
          keys(args, ["id", "note"]);
          const f = id(state.followups, args.id, "Follow-up");
          if (f.status !== "Scheduled")
            throw new LabsError(409, "Follow-up was already completed.");
          f.completionNote = text(args.note, "Completion note", 300);
          f.completedAt = at;
          f.status = "Completed";
          record(
            state,
            "Follow-up completed",
            f.id,
            "Completion recorded manually. No message was sent.",
            at,
          );
          break;
        }
        default:
          throw new LabsError(400, "Unknown automation action.");
      }
      return state;
    },
    project(state, actor): AutomationView {
      const manager = actor.role === "manager",
        customer = actor.role === "customer";
      const inquiries = state.inquiries.filter(
        (i) => manager || (customer && i.customerId === actor.customerId),
      );
      const own = new Set(inquiries.map((i) => i.id));
      const scoped = {
        ...state,
        inquiries,
        analyses: state.analyses.filter((a) => own.has(a.inquiryId)),
        quotes: state.quotes.filter((q) => own.has(q.inquiryId)),
        tasks: state.tasks.filter((t) => own.has(t.inquiryId)),
        followups: manager ? state.followups : [],
      };
      return structuredClone({
        inquiries: inquiries.map(({ customerId: _customerId, ...i }) => i),
        analyses: scoped.analyses,
        quotes: scoped.quotes.map((q) =>
          manager
            ? q
            : {
                ...q,
                approval: q.approval
                  ? { ...q.approval, note: "Human review recorded." }
                  : null,
                rejectionNote: q.rejectionNote
                  ? "Requires revised scope and review."
                  : "",
              },
        ),
        tasks: scoped.tasks.map((t) =>
          manager ? t : { ...t, runId: null, leaseUntil: null, error: "" },
        ),
        followups: manager
          ? state.followups.map((f) => ({
              ...f,
              overdue:
                f.status === "Scheduled" && Date.parse(f.dueAt) < clock(),
            }))
          : [],
        totals: automationTotals(
          manager || actor.role === "viewer" ? state : scoped,
          clock(),
        ),
        ...(manager ? { rules: state.rules, history: state.history } : {}),
      });
    },
  };
}
export const automationModule = createAutomationModule();
