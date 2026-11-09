import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type Role = "customer" | "kitchen" | "cashier" | "manager" | "viewer";
export type Actor = { role: Role; customerId: string };

export class LabsError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "LabsError";
    this.status = status;
  }
}

export type Action = {
  type: string;
  args: Record<string, unknown>;
  requestId: string;
  generation: number;
  csrf: string;
};

/** A module only handles domain state. The repository owns scope and transactions. */
export interface ProductModule<S> {
  id: string;
  seed(): S;
  reduce(state: S, action: Action, actor: Actor): S;
  project(state: S, actor: Actor): unknown;
}

export function validRole(value: unknown): value is Role {
  return (
    typeof value === "string" &&
    ["customer", "kitchen", "cashier", "manager", "viewer"].includes(value)
  );
}

export function assertRole(role: Role, allowed: readonly Role[]): void {
  if (!validRole(role) || !allowed.includes(role)) {
    throw new LabsError(403, "This demo role cannot perform that action.");
  }
}

export function integer(
  value: unknown,
  label: string,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new LabsError(
      400,
      `${label} must be a safe integer between ${min} and ${max}.`,
    );
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Reject values that would silently change or disappear during JSON persistence. */
function canonicalJson(
  value: unknown,
  depth = 0,
  budget = { remaining: 10_000 },
): string {
  if (depth > 20 || --budget.remaining < 0) {
    throw new LabsError(400, "Action arguments are too complex.");
  }
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === "number" && Number.isFinite(value))
    return JSON.stringify(value);
  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (let i = 0; i < value.length; i += 1) {
      parts.push(canonicalJson(value[i], depth + 1, budget));
    }
    return `[${parts.join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => {
        if (["__proto__", "constructor", "prototype"].includes(key)) {
          throw new LabsError(400, "Unsupported argument key.");
        }
        return `${JSON.stringify(key)}:${canonicalJson(value[key], depth + 1, budget)}`;
      })
      .join(",")}}`;
  }
  throw new LabsError(400, "Action arguments must contain only JSON values.");
}

export function validateAction(input: unknown): Action {
  if (
    !isRecord(input) ||
    Object.keys(input).length !== 5 ||
    Object.keys(input).some(
      (key) =>
        !["type", "args", "requestId", "generation", "csrf"].includes(key),
    )
  ) {
    throw new LabsError(
      400,
      "Expected type, args, requestId, generation and csrf.",
    );
  }
  if (
    typeof input.type !== "string" ||
    !/^[a-z][a-zA-Z0-9.-]{0,79}$/.test(input.type)
  ) {
    throw new LabsError(400, "Invalid action type.");
  }
  if (!isRecord(input.args))
    throw new LabsError(400, "Action args must be an object.");
  if (
    typeof input.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.requestId,
    )
  ) {
    throw new LabsError(400, "requestId must be a UUID.");
  }
  const generation = integer(input.generation, "generation", 1);
  if (typeof input.csrf !== "string" || !/^[0-9a-f]{64}$/.test(input.csrf)) {
    throw new LabsError(400, "Invalid CSRF token.");
  }
  const serialized = canonicalJson(input.args);
  if (Buffer.byteLength(serialized, "utf8") > 65_536) {
    throw new LabsError(400, "Action arguments are too large.");
  }
  return {
    type: input.type,
    args: JSON.parse(serialized) as Record<string, unknown>,
    requestId: input.requestId.toLowerCase(),
    generation,
    csrf: input.csrf,
  };
}

export function newToken(): string {
  return randomBytes(32).toString("hex");
}

export function tokenHash(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function constantEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Request IDs and CSRF tokens are transport metadata, not semantic intent. */
export function requestHash(action: Omit<Action, "csrf">): string {
  return tokenHash(
    canonicalJson({
      type: action.type,
      args: action.args,
      generation: action.generation,
    }),
  );
}

export type FixtureState = {
  stock: number;
  consumed: number;
  totalSen: number;
  managerNote: string;
};

function exactArgs(
  args: Record<string, unknown>,
  fields: readonly string[],
): void {
  if (
    Object.keys(args).length !== fields.length ||
    Object.keys(args).some((key) => !fields.includes(key))
  ) {
    throw new LabsError(400, "Unexpected action arguments.");
  }
}

/** Small test product used to verify repository behavior before Cafe integration. */
export const platformFixture: ProductModule<FixtureState> = {
  id: "platform-check",
  seed: () => ({
    stock: 1,
    consumed: 0,
    totalSen: 0,
    managerNote: "Fictional manager note",
  }),
  reduce(state, action, actor) {
    if (action.type === "fixture.consume") {
      assertRole(actor.role, ["cashier", "manager"]);
      exactArgs(action.args, []);
      if (state.stock < 1) throw new LabsError(409, "No stock remaining.");
      return {
        ...state,
        stock: state.stock - 1,
        consumed: state.consumed + 1,
        totalSen: state.totalSen + 1000,
      };
    }
    if (action.type === "fixture.note") {
      assertRole(actor.role, ["manager"]);
      exactArgs(action.args, ["note"]);
      if (
        typeof action.args.note !== "string" ||
        action.args.note.length > 500
      ) {
        throw new LabsError(
          400,
          "Note must be a string of at most 500 characters.",
        );
      }
      return { ...state, managerNote: action.args.note };
    }
    throw new LabsError(400, "Unknown fixture action.");
  },
  project(state, actor) {
    assertRole(actor.role, [
      "customer",
      "kitchen",
      "cashier",
      "manager",
      "viewer",
    ]);
    if (actor.role === "manager") return { ...state };
    if (actor.role === "kitchen")
      return { stock: state.stock, consumed: state.consumed };
    return {
      stock: state.stock,
      consumed: state.consumed,
      totalSen: state.totalSen,
    };
  },
};
