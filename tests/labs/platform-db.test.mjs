import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import {
  createRepository,
  createDatabase,
  loadLocalEnvironment,
} from "../../packages/database/index.ts";
import {
  LabsError,
  platformFixture,
  tokenHash,
} from "../../packages/demo-platform/index.ts";

loadLocalEnvironment("test");
// These checks must never fall back to the developer's ordinary database.
for (const key of ["DATABASE_URL", "MIGRATION_DATABASE_URL"]) {
  assert.ok(
    process.env[key],
    `${key} must explicitly configure the test database`,
  );
  assert.match(
    new URL(process.env[key]).pathname,
    /test/i,
    `${key} must name a test database`,
  );
}
const db = createDatabase();
const owner = createDatabase(process.env.MIGRATION_DATABASE_URL);
const repo = createRepository(db, platformFixture);

const failsWith = (status) => (error) =>
  error instanceof LabsError && error.status === status;
const action = (packet, type, args = {}, overrides = {}) => ({
  type,
  args,
  requestId: randomUUID(),
  generation: packet.generation,
  csrf: packet.csrf,
  ...overrides,
});
async function startAs(role, repository = repo) {
  const session = await repository.start();
  if (session.packet.role !== role) {
    session.packet = await repository.act(
      session.token,
      action(session.packet, "role", { role }),
    );
  }
  return session;
}
async function scope(tx, session, overrides = {}) {
  const p = session.packet;
  await tx.$queryRawUnsafe(
    "SELECT set_config('labs.workspace', $1, true), set_config('labs.product', $2, true), set_config('labs.generation', $3, true), set_config('labs.token', $4, true)",
    overrides.workspace ?? p.workspaceId,
    overrides.product ?? p.product,
    String(overrides.generation ?? p.generation),
    overrides.token ?? tokenHash(session.token),
  );
}
async function storedState(session) {
  const rows = await owner.$queryRawUnsafe(
    "SELECT state FROM platform.documents WHERE workspace_id = $1::uuid AND product = $2 AND generation = $3",
    session.packet.workspaceId,
    session.packet.product,
    session.packet.generation,
  );
  assert.equal(rows.length, 1);
  return rows[0].state;
}

await test("runtime PostgreSQL role is non-owner, cannot bypass RLS and has no schema DDL privileges", async () => {
  const [role] = await db.$queryRawUnsafe(
    "SELECT current_user AS name, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb FROM pg_roles WHERE rolname = current_user",
  );
  assert.equal(role.rolsuper, false);
  assert.equal(role.rolbypassrls, false);
  assert.equal(role.rolcreaterole, false);
  assert.equal(role.rolcreatedb, false);
  const tables = await db.$queryRawUnsafe(
    "SELECT c.relname, c.relrowsecurity, pg_get_userbyid(c.relowner) AS owner FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'platform' AND c.relname IN ('workspaces', 'sessions', 'documents')",
  );
  assert.equal(tables.length, 3);
  for (const table of tables) {
    assert.notEqual(table.owner, role.name);
    assert.equal(
      table.relrowsecurity,
      true,
      `${table.relname} must enable RLS`,
    );
  }
  const [privilege] = await db.$queryRawUnsafe(
    "SELECT has_schema_privilege(current_user, 'platform', 'CREATE') AS can_create",
  );
  assert.equal(privilege.can_create, false);
});

await test("sessions persist hashed tokens and isolate independent visitors", async () => {
  const a = await startAs("manager");
  const b = await startAs("manager");
  assert.notEqual(a.token, b.token);
  assert.notEqual(a.packet.workspaceId, b.packet.workspaceId);
  assert.notEqual(a.packet.customerId, b.packet.customerId);
  await repo.act(
    a.token,
    action(a.packet, "fixture.note", { note: "Workspace A sentinel" }),
  );
  assert.equal(
    (await repo.read(b.token)).state.managerNote,
    platformFixture.seed().managerNote,
  );
  const rows = await owner.$queryRawUnsafe(
    "SELECT token_hash FROM platform.sessions WHERE workspace_id = $1::uuid",
    a.packet.workspaceId,
  );
  assert.ok(rows.some((row) => row.token_hash === tokenHash(a.token)));
  assert.ok(rows.every((row) => row.token_hash !== a.token));
  await assert.rejects(repo.read("0".repeat(64)), failsWith(401));
});

await test("RLS fails closed without context and blocks another workspace's read, update and delete", async () => {
  const a = await startAs("manager");
  const b = await startAs("manager");
  assert.deepEqual(
    await db.$queryRawUnsafe("SELECT state FROM platform.documents"),
    [],
  );
  await db.$transaction(async (tx) => {
    await scope(tx, a);
    const rows = await tx.$queryRawUnsafe(
      "SELECT workspace_id, state FROM platform.documents",
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].workspace_id, a.packet.workspaceId);
    const aggregate = await tx.$queryRawUnsafe(
      "SELECT count(*)::int AS count FROM platform.documents",
    );
    assert.equal(aggregate[0].count, 1);
    assert.equal(
      await tx.$executeRawUnsafe(
        "UPDATE platform.documents SET state = '{}'::jsonb WHERE workspace_id = $1::uuid",
        b.packet.workspaceId,
      ),
      0,
    );
    assert.equal(
      await tx.$executeRawUnsafe(
        "DELETE FROM platform.documents WHERE workspace_id = $1::uuid",
        b.packet.workspaceId,
      ),
      0,
    );
  });
  assert.deepEqual(await storedState(b), platformFixture.seed());
  await assert.rejects(
    db.$transaction(async (tx) => {
      await scope(tx, a);
      await tx.$executeRawUnsafe(
        "INSERT INTO platform.documents(workspace_id, product, generation, state) VALUES ($1::uuid, $2, $3, '{}'::jsonb)",
        b.packet.workspaceId,
        b.packet.product,
        b.packet.generation + 1,
      );
    }),
  );
});

await test("transaction-local scope disappears after commit and rollback on reused connections", async () => {
  const connection = createDatabase();
  try {
    const a = await startAs("manager");
    const b = await startAs("manager");
    let firstPid;
    await connection.$transaction(async (tx) => {
      await scope(tx, a);
      firstPid = (await tx.$queryRawUnsafe("SELECT pg_backend_pid() AS pid"))[0]
        .pid;
      assert.equal(
        (
          await tx.$queryRawUnsafe(
            "SELECT workspace_id FROM platform.documents",
          )
        )[0].workspace_id,
        a.packet.workspaceId,
      );
    });
    await assert.rejects(
      connection.$transaction(async (tx) => {
        await scope(tx, b);
        assert.equal(
          (await tx.$queryRawUnsafe("SELECT pg_backend_pid() AS pid"))[0].pid,
          firstPid,
        );
        assert.equal(
          (
            await tx.$queryRawUnsafe(
              "SELECT workspace_id FROM platform.documents",
            )
          )[0].workspace_id,
          b.packet.workspaceId,
        );
        throw new Error("Deliberate rollback sentinel");
      }),
      /Deliberate rollback sentinel/,
    );
    await connection.$transaction(async (tx) => {
      assert.equal(
        (await tx.$queryRawUnsafe("SELECT pg_backend_pid() AS pid"))[0].pid,
        firstPid,
      );
      assert.deepEqual(
        await tx.$queryRawUnsafe("SELECT workspace_id FROM platform.documents"),
        [],
      );
    });
  } finally {
    await connection.$disconnect();
  }
});

await test("product-scoped repositories cannot reuse another product's session or reset its data", async () => {
  const other = createRepository(db, {
    ...platformFixture,
    id: "platform-other",
  });
  const a = await startAs("manager");
  const b = await startAs("manager", other);
  await assert.rejects(other.read(a.token), failsWith(401));
  await assert.rejects(
    other.act(a.token, action(a.packet, "reset")),
    failsWith(401),
  );
  await repo.act(
    a.token,
    action(a.packet, "fixture.note", {
      note: "Persist across another product reset",
    }),
  );
  await other.act(b.token, action(b.packet, "reset"));
  assert.equal(
    (await repo.read(a.token)).state.managerNote,
    "Persist across another product reset",
  );
  await db.$transaction(async (tx) => {
    await scope(tx, a, { product: b.packet.product });
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT workspace_id FROM platform.documents"),
      [],
    );
  });
});

await test("all role projections and server capabilities apply to read and mutation responses", async () => {
  const session = await startAs("manager");
  for (const role of ["customer", "kitchen", "cashier", "viewer", "manager"]) {
    session.packet = await repo.act(
      session.token,
      action(session.packet, "role", { role }),
    );
    const read = await repo.read(session.token);
    assert.equal(read.role, role);
    assert.equal("managerNote" in read.state, role === "manager");
    assert.equal("managerNote" in session.packet.state, role === "manager");
    assert.equal("totalSen" in read.state, role !== "kitchen");
    if (role !== "manager") {
      await assert.rejects(
        repo.act(
          session.token,
          action(read, "fixture.note", { note: "Forbidden" }),
        ),
        failsWith(403),
      );
    }
    if (["customer", "kitchen", "viewer"].includes(role)) {
      await assert.rejects(
        repo.act(session.token, action(read, "fixture.consume")),
        failsWith(403),
      );
    }
  }
  assert.deepEqual(await storedState(session), platformFixture.seed());
});

await test("concurrent independent connections cannot consume the same last stock unit", async () => {
  const second = createDatabase();
  try {
    const other = createRepository(second, platformFixture);
    const s = await startAs("cashier");
    const results = await Promise.allSettled([
      repo.act(s.token, action(s.packet, "fixture.consume")),
      other.act(s.token, action(s.packet, "fixture.consume")),
    ]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    const rejected = results.find((result) => result.status === "rejected");
    assert.ok(rejected && failsWith(409)(rejected.reason));
    assert.deepEqual((await repo.read(s.token)).state, {
      stock: 0,
      consumed: 1,
      totalSen: 1000,
    });
  } finally {
    await second.$disconnect();
  }
});

await test("concurrent duplicate request commits once; changed intent with the same key is rejected", async () => {
  const s = await startAs("cashier");
  const request = action(s.packet, "fixture.consume");
  const results = await Promise.all([
    repo.act(s.token, request),
    repo.act(s.token, request),
  ]);
  assert.deepEqual(results[0], results[1]);
  assert.equal((await repo.read(s.token)).state.consumed, 1);
  await assert.rejects(
    repo.act(s.token, { ...request, type: "role", args: { role: "manager" } }),
    failsWith(409),
  );
  assert.equal((await repo.read(s.token)).role, "cashier");
});

await test("cached manager response is not exposed or used to restore permissions after role downgrade", async () => {
  const s = await startAs("manager");
  const request = action(s.packet, "fixture.note", {
    note: "Manager-only replay sentinel",
  });
  await repo.act(s.token, request);
  const downgraded = await repo.act(
    s.token,
    action(s.packet, "role", { role: "kitchen" }),
  );
  try {
    const replay = await repo.act(s.token, request);
    assert.equal(replay.role, "kitchen");
    assert.equal("managerNote" in replay.state, false);
    assert.equal("totalSen" in replay.state, false);
  } catch (error) {
    assert.ok(failsWith(403)(error));
  }
  assert.equal((await repo.read(s.token)).role, downgraded.role);
});

await test("reset increments generation once, rejects stale writes and duplicate resets, and preserves another visitor", async () => {
  const a = await startAs("manager");
  const b = await startAs("manager");
  await repo.act(a.token, action(a.packet, "fixture.consume"));
  await repo.act(
    b.token,
    action(b.packet, "fixture.note", { note: "Unrelated visitor sentinel" }),
  );
  const reset = action(a.packet, "reset");
  const fresh = await repo.act(a.token, reset);
  assert.equal(fresh.generation, a.packet.generation + 1);
  assert.deepEqual(
    fresh.state,
    platformFixture.project(platformFixture.seed(), {
      role: fresh.role,
      customerId: fresh.customerId,
    }),
  );
  await assert.rejects(repo.act(a.token, reset), failsWith(409));
  await assert.rejects(
    repo.act(a.token, action(a.packet, "fixture.consume")),
    failsWith(409),
  );
  assert.equal((await repo.read(a.token)).generation, fresh.generation);
  assert.equal(
    (await repo.read(b.token)).state.managerNote,
    "Unrelated visitor sentinel",
  );
});

await test("reset racing a mutation leaves a fresh generation without stale side effects", async () => {
  const s = await startAs("manager");
  const results = await Promise.allSettled([
    repo.act(s.token, action(s.packet, "fixture.consume")),
    repo.act(s.token, action(s.packet, "reset")),
  ]);
  assert.equal(results[1].status, "fulfilled");
  if (results[0].status === "rejected")
    assert.ok(failsWith(409)(results[0].reason));
  const fresh = await repo.read(s.token);
  assert.equal(fresh.generation, s.packet.generation + 1);
  assert.equal(fresh.state.stock, 1);
  assert.equal(fresh.state.consumed, 0);
});

await test("throwing reducer leaves stored state unchanged and does not burn the request ID", async () => {
  const s = await startAs("manager");
  const failing = createRepository(db, {
    ...platformFixture,
    reduce(state) {
      state.stock = -100;
      throw new LabsError(400, "Deliberate reducer failure");
    },
  });
  const request = action(s.packet, "fixture.consume");
  await assert.rejects(failing.act(s.token, request), failsWith(400));
  assert.deepEqual(await storedState(s), platformFixture.seed());
  const successful = await repo.act(s.token, request);
  assert.equal(successful.state.consumed, 1);
});

await test("invalid CSRF and malformed authority cannot change stored state", async () => {
  const s = await startAs("manager");
  await assert.rejects(
    repo.act(
      s.token,
      action(s.packet, "fixture.consume", {}, { csrf: "0".repeat(64) }),
    ),
    failsWith(403),
  );
  await assert.rejects(
    repo.act(s.token, {
      ...action(s.packet, "fixture.consume"),
      workspaceId: randomUUID(),
    }),
    failsWith(400),
  );
  await assert.rejects(
    repo.act(s.token, action(s.packet, "role", { role: "admin" })),
    failsWith(400),
  );
  assert.deepEqual(await storedState(s), platformFixture.seed());
});

await test("expired sessions reject reads and mutations without changing business records", async () => {
  const s = await startAs("manager");
  await owner.$executeRawUnsafe(
    "UPDATE platform.sessions SET expires_at = clock_timestamp() - interval '1 second' WHERE workspace_id = $1::uuid",
    s.packet.workspaceId,
  );
  await assert.rejects(repo.read(s.token), failsWith(401));
  await assert.rejects(
    repo.act(s.token, action(s.packet, "fixture.consume")),
    failsWith(401),
  );
  assert.deepEqual(await storedState(s), platformFixture.seed());
});

await test("expiry is rechecked after a mutation waits for the workspace lock", async () => {
  const s = await startAs("manager");
  let pending;
  await owner.$transaction(
    async (tx) => {
      const [{ pid }] = await tx.$queryRawUnsafe(
        "SELECT pg_backend_pid() AS pid",
      );
      await tx.$queryRawUnsafe(
        "SELECT id FROM platform.workspaces WHERE id = $1::uuid FOR UPDATE",
        s.packet.workspaceId,
      );
      // Keep the expiry update uncommitted: the initial read sees a valid workspace.
      await tx.$executeRawUnsafe(
        "UPDATE platform.workspaces SET expires_at = clock_timestamp() - interval '1 second' WHERE id = $1::uuid",
        s.packet.workspaceId,
      );
      pending = repo.act(s.token, action(s.packet, "fixture.consume")).then(
        (value) => ({ ok: true, value }),
        (error) => ({ ok: false, error }),
      );
      let blocked = false;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const rows = await tx.$queryRawUnsafe(
          "SELECT pid FROM pg_stat_activity WHERE $1::int = ANY(pg_blocking_pids(pid))",
          pid,
        );
        if (rows.length) {
          blocked = true;
          break;
        }
        await delay(20);
      }
      assert.equal(
        blocked,
        true,
        "Mutation must actually wait for the locked workspace",
      );
    },
    { timeout: 10000 },
  );
  const result = await pending;
  assert.equal(result.ok, false);
  assert.ok(failsWith(401)(result.error));
  assert.deepEqual(await storedState(s), platformFixture.seed());
});

await test("new repository and database connection preserve sessions, state and duplicate history", async () => {
  const first = createDatabase();
  const previous = createRepository(first, platformFixture);
  let s;
  let request;
  let committed;
  try {
    s = await startAs("cashier", previous);
    request = action(s.packet, "fixture.consume");
    committed = await previous.act(s.token, request);
  } finally {
    await first.$disconnect();
  }
  const next = createDatabase();
  try {
    const restarted = createRepository(next, platformFixture);
    const read = await restarted.read(s.token);
    assert.deepEqual(read, committed);
    assert.deepEqual(await restarted.act(s.token, request), committed);
    assert.equal((await restarted.read(s.token)).state.consumed, 1);
  } finally {
    await next.$disconnect();
  }
});

await test("failed reset seed rolls back generation, state and request history", async () => {
  const s = await startAs("manager");
  await repo.act(
    s.token,
    action(s.packet, "fixture.note", { note: "Preserve through failed seed" }),
  );
  const failing = createRepository(db, {
    ...platformFixture,
    seed() {
      throw new Error("Seed unavailable");
    },
  });
  const request = action(s.packet, "reset");
  await assert.rejects(failing.act(s.token, request), /Seed unavailable/);
  const current = await repo.read(s.token);
  assert.equal(current.generation, s.packet.generation);
  assert.equal(current.state.managerNote, "Preserve through failed seed");
  assert.equal(
    (await repo.act(s.token, request)).generation,
    s.packet.generation + 1,
  );
});

await test("database rate limit rejects actions without changing business data", async () => {
  const s = await startAs("manager");
  await owner.$executeRawUnsafe(
    "UPDATE platform.sessions SET requests=120,window_at=clock_timestamp() WHERE workspace_id=$1::uuid",
    s.packet.workspaceId,
  );
  await assert.rejects(
    repo.act(s.token, action(s.packet, "fixture.consume")),
    failsWith(429),
  );
  assert.deepEqual(await storedState(s), platformFixture.seed());
});

await test("bounded expiry cleanup preserves live and unrelated workspaces", async () => {
  const dead = await startAs("manager"),
    live = await startAs("manager");
  await owner.$executeRawUnsafe(
    "UPDATE platform.workspaces SET expires_at=clock_timestamp()-interval '1 day' WHERE id=$1::uuid",
    dead.packet.workspaceId,
  );
  const [{ removed }] = await db.$queryRawUnsafe(
    "SELECT platform.prune_expired() AS removed",
  );
  assert.ok(removed >= 1 && removed <= 50);
  assert.deepEqual(
    await owner.$queryRawUnsafe(
      "SELECT id FROM platform.workspaces WHERE id=$1::uuid",
      dead.packet.workspaceId,
    ),
    [],
  );
  assert.deepEqual(await storedState(live), platformFixture.seed());
  await assert.rejects(repo.read(dead.token), failsWith(401));
  await assert.rejects(db.$queryRawUnsafe("SELECT * FROM platform.admission"));
});

await test("composite foreign keys reject cross-product document associations", async () => {
  const s = await startAs("manager");
  await assert.rejects(
    owner.$executeRawUnsafe(
      "INSERT INTO platform.documents(workspace_id,product,generation,state) VALUES($1::uuid,'wrong-product',1,'{}'::jsonb)",
      s.packet.workspaceId,
    ),
  );
});

// Register cleanup after awaited top-level tests so Node does not disconnect the
// client while the first subsequent test is registering its transaction.
after(async () => {
  await Promise.all([db.$disconnect(), owner.$disconnect()]);
});
