import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { applyAction, DemoError, initialState, type DemoState } from "./engine";

type Session = {
  state: DemoState;
  csrf: string;
  expires: number;
  window: number;
  requests: number;
  seen: Set<string>;
};
type Store = {
  sessions: Map<string, Session>;
  window: number;
  creates: number;
};
const globalStore = globalThis as typeof globalThis & { __kezuvioDemo?: Store };
const store = (globalStore.__kezuvioDemo ??= {
  sessions: new Map(),
  window: Date.now(),
  creates: 0,
});
const TTL = 60 * 60 * 1000,
  COOKIE = "kezuvio-demo";
function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      Vary: "Cookie",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
function sessionFor(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const session = token ? store.sessions.get(token) : undefined;
  if (!session || session.expires < Date.now()) {
    if (token) store.sessions.delete(token);
    throw new DemoError(
      "Your demo session expired. Start a fresh workspace.",
      401,
    );
  }
  return session;
}
function consume(session: Session) {
  const now = Date.now();
  if (now - session.window > 60000) {
    session.window = now;
    session.requests = 0;
  }
  if (++session.requests > 120)
    throw new DemoError("Too many demo requests. Please wait one minute.", 429);
}
function packet(session: Session) {
  return {
    state: session.state,
    csrf: session.csrf,
    expiresAt: session.expires,
  };
}
function errorResponse(error: unknown) {
  if (error instanceof DemoError)
    return response({ error: error.message }, error.status);
  console.error(
    "Demo operation failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return response(
    { error: "The demo could not complete that action. Please try again." },
    500,
  );
}
export function getSession(req: NextRequest) {
  try {
    // Cross-site requests cannot create/read a workspace. Same-origin fetch and direct navigation remain valid.
    if (req.headers.get("sec-fetch-site") === "cross-site")
      throw new DemoError("Cross-site demo requests are not allowed.", 403);
    const token = req.cookies.get(COOKIE)?.value;
    const existing = token ? store.sessions.get(token) : undefined;
    if (existing && existing.expires > Date.now()) {
      consume(existing);
      return response(packet(existing));
    }
    const now = Date.now();
    for (const [key, session] of store.sessions)
      if (session.expires < now) store.sessions.delete(key);
    if (now - store.window > 60000) {
      store.window = now;
      store.creates = 0;
    }
    if (++store.creates > 300 || store.sessions.size >= 100)
      throw new DemoError(
        "Demo capacity is temporarily full. Please try again later.",
        429,
      );
    const session: Session = {
      state: initialState(),
      csrf: randomBytes(24).toString("hex"),
      expires: now + TTL,
      window: now,
      requests: 0,
      seen: new Set(),
    };
    const key = randomBytes(32).toString("hex");
    store.sessions.set(key, session);
    const res = response(packet(session));
    res.cookies.set(COOKIE, key, {
      httpOnly: true,
      secure:
        req.nextUrl.protocol === "https:" ||
        !!process.env.DEMO_ORIGIN?.startsWith("https://"),
      sameSite: "strict",
      path: "/api/demo",
      maxAge: TTL / 1000,
    });
    return res;
  } catch (error) {
    return errorResponse(error);
  }
}
async function readBody(req: NextRequest) {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new DemoError("Expected JSON.", 415);
  const reader = req.body?.getReader();
  if (!reader) throw new DemoError("Missing request body.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 8192) {
      await reader.cancel();
      throw new DemoError("Request is too large.", 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new DemoError("Invalid JSON.");
  }
}
export async function mutateSession(req: NextRequest) {
  try {
    // Next normalizes 127.0.0.1 to localhost in nextUrl. Compare the browser's
    // actual Host authority, or the explicitly configured reverse-proxy origin.
    const expectedOrigin =
      process.env.DEMO_ORIGIN ||
      new URL(
        `${req.nextUrl.protocol}//${req.headers.get("host") || req.nextUrl.host}`,
      ).origin;
    if (req.headers.get("origin") !== expectedOrigin)
      throw new DemoError("Request origin is not allowed.", 403);
    const session = sessionFor(req);
    consume(session);
    const body = await readBody(req);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new DemoError("Invalid action.");
    const csrf = typeof body.csrf === "string" ? body.csrf : "";
    if (
      Buffer.byteLength(csrf) !== Buffer.byteLength(session.csrf) ||
      !timingSafeEqual(Buffer.from(csrf), Buffer.from(session.csrf))
    )
      throw new DemoError("Invalid session token. Refresh the demo.", 403);
    if (
      typeof body.requestId !== "string" ||
      !/^[a-zA-Z0-9-]{8,80}$/.test(body.requestId)
    )
      throw new DemoError("A valid request identifier is required.");
    if (session.seen.has(body.requestId)) return response(packet(session));
    if (
      typeof body.action !== "string" ||
      !body.args ||
      typeof body.args !== "object" ||
      Array.isArray(body.args)
    )
      throw new DemoError("Invalid action payload.");
    // No await between read, validation and replacement: mutations are atomic within this Node process.
    session.state = applyAction(session.state, body.action, body.args);
    session.seen.add(body.requestId);
    if (session.seen.size > 100)
      session.seen.delete(session.seen.values().next().value!);
    return response(packet(session));
  } catch (error) {
    return errorResponse(error);
  }
}
