import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../../packages/database/index.ts";
import { interiorModule } from "../../packages/interior/index.ts";
import { quoteDesign } from "../../packages/interior/helpers.ts";
import { accountingModule } from "../../packages/accounting/index.ts";
loadLocalEnvironment("test");
for (const key of ["DATABASE_URL", "MIGRATION_DATABASE_URL"])
  assert.ok(new URL(process.env[key]).pathname.endsWith("_test"));
const runtime = createDatabase(),
  owner = createDatabase(process.env.MIGRATION_DATABASE_URL),
  repo = createRepository(runtime, interiorModule);
const intent = (p, type, args = {}) => ({
  type,
  args,
  generation: p.generation,
  csrf: p.csrf,
  requestId: randomUUID(),
});
const fails = (status) => (error) => error.status === status;
async function visitor(repository = repo) {
  const s = await repository.start();
  s.read = async () => (s.packet = await repository.read(s.token));
  s.act = async (type, args = {}) =>
    (s.packet = await repository.act(s.token, intent(s.packet, type, args)));
  return s;
}
const selected = (s) =>
  s.packet.state.designs.find((d) => d.id === s.packet.state.selectedDesignId);
const ref = (d) => ({ id: d.id, version: d.version });
const details = (d, changes = {}) => ({
  ...ref(d),
  name: d.name,
  widthCm: d.widthCm,
  depthCm: d.depthCm,
  heightCm: d.heightCm,
  wallColor: d.wallColor,
  floorMaterial: d.floorMaterial,
  ...changes,
});
async function empty() {
  const s = await visitor();
  await s.act("design.create", {
    name: "Fictional integration room",
    presetId: "studio",
  });
  return s;
}
async function stored(s) {
  return (
    await owner.$queryRawUnsafe(
      "SELECT state FROM interior.documents WHERE workspace_id=$1::uuid AND generation=$2",
      s.packet.workspaceId,
      s.packet.generation,
    )
  )[0].state;
}

await test("Interior scene serialization and integer estimate persist through independent connections", async () => {
  const s = await empty();
  await s.act("item.add", {
    ...ref(selected(s)),
    catalogId: "chair",
    xCm: 0,
    zCm: 0,
  });
  await s.act("design.save", {
    ...ref(selected(s)),
    name: "Fictional saved room",
  });
  const other = createDatabase();
  try {
    const p = await createRepository(other, interiorModule).read(s.token);
    assert.deepEqual(p.state.designs, s.packet.state.designs);
    const d = p.state.designs.find((d) => d.id === p.state.selectedDesignId),
      q = quoteDesign(d, p.state.catalog);
    assert.equal(q.itemCount, 1);
    assert.ok(Number.isSafeInteger(q.totalSen));
    assert.ok(q.totalSen > 0);
  } finally {
    await other.$disconnect();
  }
});

await test("Separate-connection duplicate insert has one effect; competing same-version placements cannot overlap", async () => {
  const s = await empty(),
    request = intent(s.packet, "item.add", {
      ...ref(selected(s)),
      catalogId: "chair",
      xCm: 0,
      zCm: 0,
    });
  const other = createDatabase();
  try {
    await Promise.all([
      repo.act(s.token, request),
      createRepository(other, interiorModule).act(s.token, request),
    ]);
    await s.read();
    assert.equal(selected(s).items.length, 1);
    const version = selected(s).version;
    const args = { ...ref(selected(s)), catalogId: "lamp", xCm: 300, zCm: 200 };
    const outcomes = await Promise.allSettled([
      repo.act(s.token, intent(s.packet, "item.add", args)),
      createRepository(other, interiorModule).act(
        s.token,
        intent(s.packet, "item.add", args),
      ),
    ]);
    assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
    await s.read();
    assert.equal(selected(s).items.length, 2);
    assert.equal(selected(s).version, version + 1);
    const [audit] = await owner.$queryRawUnsafe(
      "SELECT count(*)::int AS n FROM platform.audit WHERE workspace_id=$1::uuid AND action='item.add'",
      s.packet.workspaceId,
    );
    assert.equal(audit.n, 2);
  } finally {
    await other.$disconnect();
  }
});

await test("Duplicate design has independent item identities and source survives edits and failed room shrink", async () => {
  const s = await visitor(),
    original = structuredClone(selected(s));
  await s.act("design.duplicate", {
    ...ref(original),
    name: "Fictional copied lounge",
  });
  const copy = structuredClone(selected(s));
  assert.notEqual(copy.id, original.id);
  assert.ok(
    copy.items.every(
      (item) => !original.items.some((source) => source.id === item.id),
    ),
  );
  await s.act("item.remove", { ...ref(copy), itemId: copy.items[0].id });
  await s.act("design.load", { id: original.id });
  assert.deepEqual(selected(s), original);
  const before = await stored(s);
  await assert.rejects(
    s.act("design.update", details(original, { widthCm: 200, depthCm: 200 })),
    fails(409),
  );
  assert.deepEqual(await stored(s), before);
});

await test("Database shape, bounds and floor-overlap checks reject direct corruption without partial state", async () => {
  const s = await visitor(),
    before = await stored(s);
  const invalidPrice = structuredClone(before);
  invalidPrice.catalog[0].unitPriceSen = 1.5;
  const outside = structuredClone(before);
  outside.designs[0].items[0].xCm = 2000;
  const overlap = structuredClone(before);
  overlap.designs[0].items[1].xCm = overlap.designs[0].items[0].xCm;
  overlap.designs[0].items[1].zCm = overlap.designs[0].items[0].zCm;
  const missing = structuredClone(before);
  missing.selectedDesignId = randomUUID();
  for (const state of [invalidPrice, outside, overlap, missing])
    await assert.rejects(
      owner.$executeRawUnsafe(
        "UPDATE interior.documents SET state=$2::jsonb WHERE workspace_id=$1::uuid",
        s.packet.workspaceId,
        JSON.stringify(state),
      ),
    );
  assert.deepEqual(await stored(s), before);
});

await test("Server capabilities, foreign references and pricing versions protect saved designs", async () => {
  const a = await empty(),
    b = await empty();
  const foreign = selected(b).id;
  await assert.rejects(a.act("design.load", { id: foreign }), fails(404));
  await assert.rejects(
    a.act("pricing.update", {
      version: a.packet.state.pricingVersion,
      catalogId: "chair",
      unitPriceSen: 12345,
    }),
    fails(403),
  );
  await a.act("role", { role: "manager" });
  const priceVersion = a.packet.state.pricingVersion;
  const request = intent(a.packet, "pricing.update", {
    version: priceVersion,
    catalogId: "chair",
    unitPriceSen: 12345,
  });
  await repo.act(a.token, request);
  await a.read();
  assert.equal(
    a.packet.state.catalog.find((c) => c.id === "chair").unitPriceSen,
    12345,
  );
  await assert.rejects(
    a.act("pricing.update", {
      version: priceVersion,
      catalogId: "chair",
      unitPriceSen: 1,
    }),
    fails(409),
  );
  await a.act("role", { role: "viewer" });
  const replay = await repo.act(a.token, request);
  assert.equal(replay.role, "viewer");
  assert.equal(replay.state.canEdit, false);
  assert.equal(replay.state.canPrice, false);
  await assert.rejects(
    a.act("design.create", { name: "Forbidden", presetId: "studio" }),
    fails(403),
  );
});

await test("Interior runtime RLS fails closed across visitors, products and generations", async () => {
  const a = await visitor(),
    b = await visitor();
  assert.deepEqual(
    await runtime.$queryRawUnsafe("SELECT * FROM interior.documents"),
    [],
  );
  await runtime.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.workspace',$1,true),set_config('labs.product','interior-3d',true),set_config('labs.generation','1',true)",
      a.packet.workspaceId,
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT workspace_id FROM interior.documents"),
      [{ workspace_id: a.packet.workspaceId }],
    );
    assert.equal(
      await tx.$executeRawUnsafe(
        "DELETE FROM interior.documents WHERE workspace_id=$1::uuid",
        b.packet.workspaceId,
      ),
      0,
    );
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.product','accounting-cloud',true)",
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT * FROM interior.documents"),
      [],
    );
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.product','interior-3d',true),set_config('labs.generation','99',true)",
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT * FROM interior.documents"),
      [],
    );
  });
});

await test("Reset racing an edit leaves a fresh Interior generation and preserves Accounting and another visitor", async () => {
  const a = await empty(),
    b = await empty(),
    accountingRepo = createRepository(runtime, accountingModule),
    accounting = await visitor(accountingRepo);
  const otherDesigns = structuredClone(b.packet.state.designs),
    journals = structuredClone(accounting.packet.state.journals);
  const old = intent(
    a.packet,
    "design.update",
    details(selected(a), { name: "Stale concurrent name" }),
  );
  const reset = intent(a.packet, "reset");
  const results = await Promise.allSettled([
    repo.act(a.token, old),
    repo.act(a.token, reset),
  ]);
  assert.equal(results[1].status, "fulfilled");
  await a.read();
  assert.equal(a.packet.generation, 2);
  assert.equal(a.packet.state.designs.length, 1);
  assert.ok(
    a.packet.state.designs.every((d) => d.name !== "Stale concurrent name"),
  );
  await assert.rejects(repo.act(a.token, old), fails(409));
  assert.deepEqual((await repo.read(b.token)).state.designs, otherDesigns);
  assert.deepEqual(
    (await accountingRepo.read(accounting.token)).state.journals,
    journals,
  );
});
after(async () => {
  await runtime.$disconnect();
  await owner.$disconnect();
});
