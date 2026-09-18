import { randomUUID } from "node:crypto";

export const roles = [
  {
    id: "alex",
    name: "Alex",
    responsibility: "Scope, dependencies and integration",
  },
  {
    id: "sam",
    name: "Sam",
    responsibility: "Frontend, backend and data engineering",
  },
  {
    id: "mia",
    name: "Mia",
    responsibility: "Design, responsive flows and accessibility",
  },
  {
    id: "ada",
    name: "Ada",
    responsibility: "Correctness, security and regression",
  },
  {
    id: "cleo",
    name: "Cleo",
    responsibility: "Honest marketing and SEO drafts",
  },
  {
    id: "ava",
    name: "Ava",
    responsibility: "Requirements, estimates and readiness",
  },
] as const;
export const checks = [
  { id: "brand", label: "Verify shared brand assets" },
  { id: "unit", label: "Verify legacy domain rules" },
  { id: "studio", label: "Verify studio workflow and analytics" },
] as const;
export type OperationsTask = {
  id: string;
  title: string;
  role: string;
  check: string;
  status:
    | "awaiting_approval"
    | "approved"
    | "running"
    | "succeeded"
    | "failed"
    | "timed_out"
    | "interrupted";
  attempts: number;
  timeoutSeconds: number;
  elapsedMs: number;
  createdAt: string;
  updatedAt: string;
  logs: { at: string; event: string; detail: string }[];
};
export type OperationsState = {
  version: 1;
  workspace: "local-studio";
  tasks: OperationsTask[];
};
export class OperationsError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export const emptyOperations = (): OperationsState => ({
  version: 1,
  workspace: "local-studio",
  tasks: [],
});
/** Caller serializes commits. A rejected write never publishes a candidate. */
export async function durableOperationsChange<T>(
  current: OperationsState,
  change: (candidate: OperationsState) => T,
  persist: (candidate: OperationsState) => Promise<void>,
) {
  const candidate = structuredClone(current);
  const result = change(candidate);
  await persist(candidate);
  return { state: candidate, result };
}
export function exactFields(input: Record<string, unknown>, keys: string[]) {
  if (Object.keys(input).some((key) => !["action", ...keys].includes(key)))
    throw new OperationsError(400, "Unexpected operation fields.");
}
function log(task: OperationsTask, event: string, detail: string, now: string) {
  task.updatedAt = now;
  task.logs.push({ at: now, event, detail });
  task.logs = task.logs.slice(-30);
}
export function operationsAction(
  state: OperationsState,
  input: Record<string, unknown>,
  now = new Date().toISOString(),
) {
  const action = input.action;
  if (action === "create") {
    exactFields(input, ["title", "role", "check", "timeoutSeconds"]);
    if (
      typeof input.title !== "string" ||
      input.title.trim().length < 3 ||
      input.title.length > 120 ||
      /[\x00-\x1f]/.test(input.title)
    )
      throw new OperationsError(400, "Use a task title of 3–120 characters.");
    if (
      !roles.some((role) => role.id === input.role) ||
      !checks.some((check) => check.id === input.check)
    )
      throw new OperationsError(
        400,
        "Choose a configured role and local check.",
      );
    if (
      !Number.isInteger(input.timeoutSeconds) ||
      Number(input.timeoutSeconds) < 1 ||
      Number(input.timeoutSeconds) > 30
    )
      throw new OperationsError(400, "Timeout must be 1–30 seconds.");
    if (state.tasks.length >= 100)
      throw new OperationsError(
        409,
        "The local task limit is 100. Archive the private state file offline before starting a new workspace.",
      );
    const task: OperationsTask = {
      id: randomUUID(),
      title: input.title.trim(),
      role: String(input.role),
      check: String(input.check),
      timeoutSeconds: Number(input.timeoutSeconds),
      status: "awaiting_approval",
      attempts: 0,
      elapsedMs: 0,
      createdAt: now,
      updatedAt: now,
      logs: [],
    };
    log(
      task,
      "created",
      "Assignment recorded; local check needs human approval.",
      now,
    );
    state.tasks.unshift(task);
    return task;
  }
  exactFields(input, ["id"]);
  const task = state.tasks.find((task) => task.id === input.id);
  if (!task)
    throw new OperationsError(404, "Task not found in the local workspace.");
  if (action === "approve" && task.status === "awaiting_approval") {
    task.status = "approved";
    log(
      task,
      "approved",
      "Operator approved only the named local validation check.",
      now,
    );
  } else if (
    action === "retry" &&
    ["failed", "timed_out", "interrupted"].includes(task.status) &&
    task.attempts < 3
  ) {
    task.status = "awaiting_approval";
    log(
      task,
      "retry_requested",
      "Retry requires a fresh approval; maximum three attempts.",
      now,
    );
  } else if (
    action === "run" &&
    task.status === "approved" &&
    task.attempts < 3
  ) {
    if (state.tasks.some((other) => other.status === "running"))
      throw new OperationsError(409, "Another local check is running.");
    task.status = "running";
    task.attempts++;
    log(
      task,
      "started",
      `Attempt ${task.attempts} with ${task.timeoutSeconds}s timeout.`,
      now,
    );
  } else throw new OperationsError(409, "Task transition is not allowed.");
  return task;
}
export function finishOperation(
  task: OperationsTask,
  result: {
    status: "succeeded" | "failed" | "timed_out";
    elapsedMs: number;
    detail: string;
  },
  now = new Date().toISOString(),
) {
  if (task.status !== "running")
    throw new OperationsError(409, "Task is not running.");
  task.status = result.status;
  task.elapsedMs += Math.max(0, Math.round(result.elapsedMs));
  log(task, result.status, result.detail.slice(0, 4000), now);
}
export function recoverOperations(state: OperationsState) {
  for (const task of state.tasks)
    if (task.status === "running") {
      task.status = "interrupted";
      log(
        task,
        "interrupted",
        "Server restarted; review output before retrying.",
        new Date().toISOString(),
      );
    }
  return state;
}
export function operationsView(state: OperationsState) {
  return {
    roles,
    checks,
    tasks: state.tasks,
    mode: "Loopback-only local checks. Role assignments are human handoffs; no live AI dispatch or external messaging.",
    metrics: {
      tasks: state.tasks.length,
      attempts: state.tasks.reduce((n, task) => n + task.attempts, 0),
      elapsedMs: state.tasks.reduce((n, task) => n + task.elapsedMs, 0),
      aiTokens: null,
      additionalPaidCostSen: 0,
    },
  };
}
