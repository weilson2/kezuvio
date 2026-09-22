import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import {
  emptyOperations,
  durableOperationsChange,
  exactFields,
  finishOperation,
  OperationsError,
  operationsAction,
  operationsView,
  recoverOperations,
  type OperationsState,
  type OperationsTask,
} from "../../../packages/studio/operations";

const cookie = "kezuvio_operations";
// These checks run only from a local repository checkout; never trace its private
// state/configuration or the whole checkout into a deployable server artifact.
const root = existsSync(resolve("scripts/check-brand.mjs"))
  ? resolve(/* turbopackIgnore: true */ ".")
  : resolve(/* turbopackIgnore: true */ "../..");
const test =
  process.env.OPERATIONS_TEST_MODE === "1" &&
  process.env.LABS_ACCEPTANCE_MODE === "1";
const directory = resolve(
  root,
  test ? "tmp/operations-preview" : ".local/operations",
);
type Runtime = {
  state?: OperationsState;
  queue: Promise<unknown>;
  sessions: Map<string, number>;
  failures: number[];
  config?: { key: string; signingKey: string };
  completionWriteFailed?: boolean;
};
const shared = globalThis as typeof globalThis & {
  kezuvioOperations?: Runtime;
};
const runtime: Runtime = (shared.kezuvioOperations ??= {
  queue: Promise.resolve(),
  sessions: new Map(),
  failures: [],
});
function serial<T>(fn: () => Promise<T>) {
  const promise = runtime.queue.then(fn);
  runtime.queue = promise.catch(() => {});
  return promise;
}
async function config() {
  if (runtime.config) return runtime.config;
  try {
    const value = test
      ? {
          key:
            process.env.OPERATIONS_TEST_KEY ||
            "kezuvio-ephemeral-operations-preview-only",
          signingKey: process.env.OPERATIONS_TEST_SIGNING_KEY,
        }
      : JSON.parse(await readFile(resolve(directory, "config.json"), "utf8"));
    if (
      typeof value.key !== "string" ||
      value.key.length < 32 ||
      typeof value.signingKey !== "string" ||
      value.signingKey.length < 32
    )
      throw new Error();
    return (runtime.config = value);
  } catch {
    throw new OperationsError(
      503,
      "Local operations is not configured. Run npm run operations:setup from the repository.",
    );
  }
}
function equal(a: string, b: string) {
  const aa = Buffer.from(a),
    bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
function mac(value: string, key: string) {
  return createHmac("sha256", key).update(value).digest("base64url");
}
async function auth(req: NextRequest) {
  const value = req.cookies.get(cookie)?.value || "";
  const [id, expiration, signature, extra] = value.split(".");
  const { signingKey } = await config();
  if (
    extra ||
    !id ||
    !/^\d+$/.test(expiration || "") ||
    Number(expiration) <= Date.now() ||
    !equal(signature || "", mac(`${id}.${expiration}`, signingKey)) ||
    runtime.sessions.get(id) !== Number(expiration)
  )
    throw new OperationsError(401, "Sign in to local operations.");
  return { id, csrf: mac(`csrf:${id}`, signingKey) };
}
function local(req: NextRequest, mutation: boolean) {
  const url = new URL(req.url);
  const host = req.headers.get("host") || "";
  let incoming: URL;
  try {
    incoming = new URL(`${url.protocol}//${host}`);
  } catch {
    throw new OperationsError(403, "Request origin is not allowed.");
  }
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(incoming.hostname) ||
    incoming.host !== host ||
    req.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new OperationsError(403, "Operations is available only on loopback.");
  // Next normalizes req.url to the server hostname; compare Origin to the
  // independently validated incoming loopback Host, never forwarded headers.
  if (mutation && req.headers.get("origin") !== incoming.origin)
    throw new OperationsError(403, "Request origin is not allowed.");
}
function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex, nofollow",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
async function input(req: NextRequest) {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new OperationsError(415, "Expected JSON.");
  const reader = req.body?.getReader();
  if (!reader) throw new OperationsError(400, "Missing request body.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 8192) {
      await reader.cancel();
      throw new OperationsError(413, "Request is too large.");
    }
    chunks.push(value);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object")
      throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    throw new OperationsError(400, "Invalid JSON object.");
  }
}
async function save(candidate: OperationsState) {
  await mkdir(directory, { recursive: true });
  const temporary = resolve(directory, "state.json.tmp");
  await writeFile(temporary, JSON.stringify(candidate), { mode: 0o600 });
  await rename(temporary, resolve(directory, "state.json"));
}
async function state() {
  if (runtime.completionWriteFailed)
    throw new OperationsError(
      503,
      "A completed check could not save its result. Review local storage and restart to recover it as interrupted; do not assume success.",
    );
  if (!runtime.state) {
    let candidate: OperationsState;
    try {
      const data = JSON.parse(
        await readFile(resolve(directory, "state.json"), "utf8"),
      );
      if (
        data.version !== 1 ||
        data.workspace !== "local-studio" ||
        !Array.isArray(data.tasks) ||
        data.tasks.length > 100
      )
        throw new Error("Invalid local operations state");
      candidate = recoverOperations(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new OperationsError(
          503,
          "Local operations state needs offline review; no tasks were overwritten.",
        );
      candidate = emptyOperations();
    }
    await save(candidate);
    runtime.state = candidate;
  }
  return runtime.state;
}
function runCheck(task: OperationsTask) {
  const scripts: Record<string, string[]> = {
    brand: ["scripts/check-brand.mjs"],
    unit: ["--test", "tests/demo-engine.test.mjs"],
    studio: ["--test", "tests/studio-domain.test.mjs"],
  };
  const args = scripts[task.check];
  if (!args) throw new OperationsError(400, "Check is not configured.");
  const start = performance.now();
  // A minimal environment prevents checks from receiving database/admin/API credentials.
  const env: NodeJS.ProcessEnv = {
    NODE_ENV: "production",
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) =>
        /^(PATH|SYSTEMROOT|WINDIR|TEMP|TMP|LANG|LC_ALL)$/i.test(key),
      ),
    ),
  };
  return new Promise<{
    status: "succeeded" | "failed" | "timed_out";
    elapsedMs: number;
    detail: string;
  }>((resolveRun) => {
    execFile(
      process.execPath,
      args,
      {
        cwd: root,
        env,
        windowsHide: true,
        timeout: task.timeoutSeconds * 1000,
        maxBuffer: 32768,
        encoding: "utf8",
      },
      (error, stdout) => {
        // Only successful output from these three reviewed scripts is retained; raw errors may contain host paths.
        resolveRun({
          status: error ? (error.killed ? "timed_out" : "failed") : "succeeded",
          elapsedMs: performance.now() - start,
          detail: error
            ? error.killed
              ? "Local check exceeded its timeout."
              : "Local check failed. Review the named check in the terminal; private process errors are withheld."
            : stdout.replace(/\x1b\[[0-9;]*m/g, "").slice(-4000) ||
              "Local check passed.",
        });
      },
    );
  });
}
export async function operationsGet(req: NextRequest) {
  try {
    local(req, false);
    const session = await auth(req);
    return await serial(async () =>
      json({ ...operationsView(await state()), csrf: session.csrf }),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function operationsPost(req: NextRequest) {
  try {
    local(req, true);
    const data = await input(req);
    if (data.action === "login") {
      exactFields(data, ["key"]);
      runtime.failures = runtime.failures.filter(
        (at) => at > Date.now() - 60000,
      );
      if (runtime.failures.length >= 5)
        throw new OperationsError(
          429,
          "Too many sign-in attempts. Wait a minute.",
        );
      const { key, signingKey } = await config();
      if (typeof data.key !== "string" || !equal(data.key, key)) {
        runtime.failures.push(Date.now());
        throw new OperationsError(401, "Invalid local access key.");
      }
      for (const [id, expiration] of runtime.sessions)
        if (expiration <= Date.now()) runtime.sessions.delete(id);
      if (runtime.sessions.size >= 20)
        throw new OperationsError(
          429,
          "Local session limit reached. Sign out an existing session.",
        );
      const id = randomBytes(24).toString("base64url"),
        expiration = Date.now() + 3600000;
      runtime.sessions.set(id, expiration);
      const unsigned = `${id}.${expiration}`;
      const response = json({ ok: true });
      response.cookies.set(cookie, `${unsigned}.${mac(unsigned, signingKey)}`, {
        httpOnly: true,
        sameSite: "strict",
        secure: new URL(req.url).protocol === "https:",
        path: "/api/operations",
        maxAge: 3600,
      });
      return response;
    }
    const session = await auth(req);
    if (!equal(req.headers.get("x-operations-csrf") || "", session.csrf))
      throw new OperationsError(403, "Operation CSRF check failed.");
    if (data.action === "logout") {
      exactFields(data, []);
      runtime.sessions.delete(session.id);
      const response = json({ ok: true });
      response.cookies.set(cookie, "", {
        httpOnly: true,
        sameSite: "strict",
        path: "/api/operations",
        maxAge: 0,
      });
      return response;
    }
    // Run is split around execution so concurrent requests can observe Running and receive conflict instead of queued duplicate execution.
    if (data.action === "run") {
      const task = await serial(async () => {
        const committed = await durableOperationsChange(
          await state(),
          (candidate) => operationsAction(candidate, data),
          save,
        );
        runtime.state = committed.state;
        return structuredClone(committed.result);
      });
      const result = await runCheck(task);
      return await serial(async () => {
        try {
          const committed = await durableOperationsChange(
            await state(),
            (candidate) =>
              finishOperation(
                candidate.tasks.find((item) => item.id === task.id)!,
                result,
              ),
            save,
          );
          runtime.state = committed.state;
        } catch (error) {
          runtime.completionWriteFailed = true;
          throw error;
        }
        return json({ ...operationsView(await state()), csrf: session.csrf });
      });
    }
    return await serial(async () => {
      const committed = await durableOperationsChange(
        await state(),
        (current) => {
          if (data.action === "mock") {
            exactFields(data, ["event"]);
            if (data.event === "create")
              operationsAction(current, {
                action: "create",
                title: "Mock Telegram: verify brand",
                role: "ada",
                check: "brand",
                timeoutSeconds: 10,
              });
            else if (data.event !== "status")
              throw new OperationsError(400, "Unknown local mock event.");
          } else operationsAction(current, data);
        },
        save,
      );
      runtime.state = committed.state;
      return json({ ...operationsView(committed.state), csrf: session.csrf });
    });
  } catch (error) {
    return failure(error);
  }
}
function failure(error: unknown) {
  return json(
    {
      error:
        error instanceof OperationsError
          ? error.message
          : "Local operation failed. Review the local state and server logs.",
    },
    error instanceof OperationsError ? error.status : 500,
  );
}
