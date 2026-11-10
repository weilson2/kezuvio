import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
  type DemoRepository,
} from "../../../../packages/database/index";
import {
  LabsError,
  platformFixture,
} from "../../../../packages/demo-platform/index";
import { cafeModule } from "../../../../packages/cafe/index";
import { commerceModule } from "../../../../packages/commerce/index";
import { automationModule } from "../../../../packages/automation/index";

const shared = globalThis as typeof globalThis & {
  kezuvioLabsDb?: ReturnType<typeof createDatabase>;
};
function repository(product: string): DemoRepository {
  // Acceptance fixtures are never exposed unless explicitly enabled at runtime.
  if (
    product !== "cafe-pos" &&
    product !== "commerce-studio" &&
    product !== "automation-hub" &&
    (process.env.LABS_ACCEPTANCE_MODE !== "1" ||
      !["platform-check", "platform-other"].includes(product))
  )
    throw new LabsError(404, "Demo product not found.");
  loadLocalEnvironment("dev", false);
  const db = (shared.kezuvioLabsDb ??= createDatabase());
  return product === "cafe-pos"
    ? createRepository(db, cafeModule)
    : product === "commerce-studio"
      ? createRepository(db, commerceModule)
      : product === "automation-hub"
        ? createRepository(db, automationModule)
        : createRepository(db, { ...platformFixture, id: product });
}
function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      Vary: "Cookie",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
function checkOrigin(req: NextRequest, mutation: boolean) {
  if (req.headers.get("sec-fetch-site") === "cross-site")
    throw new LabsError(403, "Cross-site demo requests are not allowed.");
  const expected = process.env.LABS_ORIGIN || new URL(req.url).origin;
  if (mutation && req.headers.get("origin") !== expected)
    throw new LabsError(403, "Request origin is not allowed.");
}
async function body(req: NextRequest) {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new LabsError(415, "Expected JSON.");
  const reader = req.body?.getReader();
  if (!reader) throw new LabsError(400, "Missing request body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 8192) {
      await reader.cancel();
      throw new LabsError(413, "Request is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new LabsError(400, "Invalid JSON.");
  }
}
export async function handleLabs(
  req: NextRequest,
  product: string,
  action: boolean,
) {
  const requestId = randomUUID();
  const started = performance.now();
  try {
    loadLocalEnvironment("dev", false);
    checkOrigin(req, req.method !== "GET");
    const repo = repository(product);
    const cookie = `kezuvio-labs-${product}`;
    const token = req.cookies.get(cookie)?.value;
    let response: NextResponse;
    if (action) {
      if (!token) throw new LabsError(401, "Start a demo workspace first.");
      response = json(await repo.act(token, await body(req)));
    } else if (req.method === "POST" || !token) {
      if (req.method === "POST") {
        const input = await body(req);
        if (
          !input ||
          Array.isArray(input) ||
          typeof input !== "object" ||
          Object.keys(input).length
        )
          throw new LabsError(400, "Starting a demo takes an empty object.");
      }
      const created = await repo.start();
      response = json(created.packet);
      // Keep the opaque marker beyond the DB's one-hour lifetime: expiry must
      // show the restart UI, not silently create a new workspace during polling.
      response.cookies.set(cookie, created.token, {
        httpOnly: true,
        sameSite: "strict",
        secure:
          req.nextUrl.protocol === "https:" ||
          !!process.env.LABS_ORIGIN?.startsWith("https:"),
        path: `/api/labs/${product}`,
        maxAge: 86400,
      });
    } else response = json(await repo.read(token));
    response.headers.set("X-Request-Id", requestId);
    if (req.method !== "GET")
      console.info(
        JSON.stringify({
          event: "labs.action",
          requestId,
          product,
          status: 200,
          durationMs: Math.round(performance.now() - started),
        }),
      );
    return response;
  } catch (error) {
    const known = error instanceof LabsError;
    const status = known ? error.status : 503;
    console.warn(
      JSON.stringify({
        event: "labs.rejected",
        requestId,
        product: product.slice(0, 40),
        status,
        durationMs: Math.round(performance.now() - started),
      }),
    );
    return json(
      {
        error: known
          ? error.message
          : "The demo database is unavailable. Please retry.",
        requestId,
      },
      status,
    );
  }
}
