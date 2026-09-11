import test from "node:test";
import assert from "node:assert/strict";
import {
  createInteriorModule,
  interiorLimits,
  itemFootprint,
  placementIssue,
  quoteDesign,
  roundSenRatio,
} from "../../packages/interior/index.ts";

const now = Date.parse("2026-11-23T05:00:00.000Z"),
  module = createInteriorModule(() => now);
const actor = { role: "customer", customerId: "fictional" };
const act = (state, type, args, role = "customer") =>
  module.reduce(
    state,
    { type, args, requestId: "test", csrf: "test", generation: 1 },
    { ...actor, role },
  );
const bad = (status) => (error) => error.status === status;
const selected = (state) =>
  state.designs.find((row) => row.id === state.selectedDesignId);
const ref = (design) => ({ id: design.id, version: design.version });
const update = (design, extra = {}) => ({
  ...ref(design),
  name: design.name,
  widthCm: design.widthCm,
  depthCm: design.depthCm,
  heightCm: design.heightCm,
  wallColor: design.wallColor,
  floorMaterial: design.floorMaterial,
  ...extra,
});
const transform = (design, item, extra = {}) => ({
  ...ref(design),
  itemId: item.id,
  xCm: item.xCm,
  zCm: item.zCm,
  rotationDeg: item.rotationDeg,
  widthCm: item.widthCm,
  depthCm: item.depthCm,
  heightCm: item.heightCm,
  finish: item.finish,
  ...extra,
});

test("seeded primitive room is deterministic, serializable and reconciles illustrative costs", () => {
  const state = module.seed();
  assert.deepEqual(module.seed(), state);
  assert.equal(state.catalog.length, 8);
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
  assert.equal(state.designs.length, 1);
  const design = selected(state);
  for (const item of design.items)
    assert.equal(placementIssue(design, item, item.id), null);
  const quote = quoteDesign(design, state.catalog);
  assert.equal(quote.itemCount, 3);
  assert.equal(quote.furnitureSen, 243000);
  assert.equal(quote.floorSen, 130000);
  assert.equal(quote.wallsSen, 37800);
  assert.equal(quote.totalSen, 410800);
  assert.ok(Buffer.byteLength(JSON.stringify(state)) < 10000);
});

test("customer edits own workspace, viewer reads only and manager controls pricing", () => {
  const state = module.seed();
  for (const role of ["viewer", "cashier", "kitchen"]) {
    const view = module.project(state, { ...actor, role });
    assert.equal(view.canEdit, false);
    assert.equal(view.canPrice, false);
    for (const type of [
      "design.create",
      "design.load",
      "design.save",
      "item.add",
      "item.update",
      "item.remove",
      "pricing.update",
    ])
      assert.throws(() => act(state, type, {}, role), bad(403));
  }
  assert.equal(module.project(state, actor).canEdit, true);
  assert.equal(
    module.project(state, { ...actor, role: "manager" }).canPrice,
    true,
  );
  assert.throws(
    () =>
      act(state, "pricing.update", {
        version: 1,
        catalogId: "sofa",
        unitPriceSen: 200000,
      }),
    bad(403),
  );
  const view = module.project(state, actor);
  view.designs[0].items[0].xCm = 999;
  assert.notEqual(state.designs[0].items[0].xCm, 999);
});

test("preset create, explicit save, reload selection and independent duplication preserve designs", () => {
  const state = module.seed();
  let next = act(state, "design.create", {
    name: "Fictional bedroom",
    presetId: "bedroom",
  });
  assert.equal(next.designs.length, 2);
  assert.equal(selected(next).widthCm, 450);
  assert.equal(selected(next).items.length, 0);
  next = act(next, "design.save", {
    ...ref(selected(next)),
    name: "Renamed fictional bedroom",
  });
  assert.equal(selected(next).name, "Renamed fictional bedroom");
  assert.equal(selected(next).version, 2);
  next = act(next, "design.load", { id: "design-1" });
  next = act(next, "design.duplicate", {
    ...ref(selected(next)),
    name: "Independent lounge copy",
  });
  const copy = selected(next),
    original = next.designs.find((row) => row.id === "design-1");
  assert.notEqual(copy.id, original.id);
  assert.notEqual(copy.items[0].id, original.items[0].id);
  const moved = act(
    next,
    "item.update",
    transform(copy, copy.items[0], { xCm: 40 }),
  );
  assert.equal(selected(moved).items[0].xCm, 40);
  assert.equal(
    moved.designs.find((row) => row.id === "design-1").items[0].xCm,
    30,
  );
  assert.deepEqual(state, module.seed());
});

test("deleting selected design chooses remaining design and last design cannot be removed", () => {
  const state = module.seed();
  assert.throws(
    () => act(state, "design.remove", ref(selected(state))),
    bad(409),
  );
  const copied = act(state, "design.duplicate", {
    ...ref(selected(state)),
    name: "Temporary room",
  });
  const removed = act(copied, "design.remove", ref(selected(copied)));
  assert.equal(removed.designs.length, 1);
  assert.equal(removed.selectedDesignId, "design-1");
  assert.throws(
    () => act(removed, "design.load", { id: copied.selectedDesignId }),
    bad(404),
  );
});

test("furniture insertion/removal is versioned and preserves original state on rejected overlap", () => {
  const state = module.seed(),
    before = structuredClone(state),
    design = selected(state);
  const next = act(state, "item.add", {
    ...ref(design),
    catalogId: "chair",
    xCm: 300,
    zCm: 250,
  });
  assert.equal(selected(next).items.length, 4);
  assert.equal(selected(next).version, 2);
  assert.throws(
    () =>
      act(state, "item.add", {
        ...ref(design),
        catalogId: "chair",
        xCm: 30,
        zCm: 30,
      }),
    bad(409),
  );
  assert.deepEqual(state, before);
  assert.throws(
    () =>
      act(next, "item.remove", {
        ...ref(design),
        itemId: selected(next).items.at(-1).id,
      }),
    bad(409),
  );
  const removed = act(next, "item.remove", {
    ...ref(selected(next)),
    itemId: selected(next).items.at(-1).id,
  });
  assert.equal(selected(removed).items.length, 3);
});

test("footprints use quarter-turn rotation, reject rotated boundaries and allow adjacency", () => {
  const state = module.seed(),
    design = selected(state),
    sofa = design.items[0];
  assert.deepEqual(itemFootprint(sofa), { widthCm: 180, depthCm: 85 });
  assert.deepEqual(itemFootprint({ ...sofa, rotationDeg: 90 }), {
    widthCm: 85,
    depthCm: 180,
  });
  const rotated = act(
    state,
    "item.update",
    transform(design, sofa, { xCm: 250, zCm: 100, rotationDeg: 90 }),
  );
  assert.equal(selected(rotated).items[0].rotationDeg, 90);
  assert.throws(
    () =>
      act(
        state,
        "item.update",
        transform(design, sofa, { xCm: 450, rotationDeg: 90 }),
      ),
    bad(409),
  );
  assert.throws(
    () =>
      act(state, "item.update", transform(design, sofa, { rotationDeg: 45 })),
    bad(400),
  );
  // The chair begins exactly at the sofa's right edge (x=30+180).
  const adjacent = act(state, "item.add", {
    ...ref(design),
    catalogId: "chair",
    xCm: 210,
    zCm: 30,
  });
  assert.equal(selected(adjacent).items.length, 4);
  assert.throws(
    () =>
      act(state, "item.add", {
        ...ref(design),
        catalogId: "chair",
        xCm: 209,
        zCm: 30,
      }),
    bad(409),
  );
});

test("room edits immediately change materials and reject shrinking around existing furniture", () => {
  const state = module.seed(),
    design = selected(state),
    before = structuredClone(state);
  const next = act(
    state,
    "design.update",
    update(design, {
      wallColor: "Sage",
      floorMaterial: "Terrazzo",
      widthCm: 600,
      heightCm: 300,
    }),
  );
  assert.equal(selected(next).wallColor, "Sage");
  assert.equal(selected(next).floorMaterial, "Terrazzo");
  assert.equal(selected(next).widthCm, 600);
  assert.equal(quoteDesign(selected(next), next.catalog).floorSen, 204000);
  assert.throws(
    () => act(state, "design.update", update(design, { widthCm: 400 })),
    bad(409),
  );
  assert.throws(
    () => act(state, "design.update", update(design, { heightCm: 199 })),
    bad(400),
  );
  assert.throws(
    () => act(state, "design.update", update(design, { wallColor: "Unknown" })),
    bad(400),
  );
  assert.deepEqual(state, before);
});

test("item scale limits, room height and integer geometry are enforced before saving", () => {
  const state = module.seed(),
    design = selected(state),
    item = design.items[2];
  assert.throws(
    () => act(state, "item.update", transform(design, item, { widthCm: 19 })),
    bad(400),
  );
  assert.throws(
    () => act(state, "item.update", transform(design, item, { heightCm: 300 })),
    bad(409),
  );
  assert.throws(
    () => act(state, "item.update", transform(design, item, { xCm: 1.5 })),
    bad(400),
  );
  assert.throws(
    () =>
      act(state, "item.update", transform(design, item, { finish: "Chrome" })),
    bad(400),
  );
  const finished = act(
    state,
    "item.update",
    transform(design, item, { finish: "Walnut" }),
  );
  assert.equal(
    quoteDesign(selected(finished), finished.catalog).lines.find(
      (line) => line.itemId === item.id,
    ).amountSen,
    19800,
  );
});

test("rational pricing rounds half up once and accounts for resized footprint and repeated item quantities", () => {
  assert.equal(roundSenRatio(1, 2), 1);
  assert.equal(roundSenRatio(1, 3), 0);
  assert.equal(roundSenRatio(5, 2), 3);
  assert.throws(() => roundSenRatio(-1, 2));
  assert.throws(() => roundSenRatio(1, 0));
  assert.throws(() => roundSenRatio(Number.MAX_SAFE_INTEGER + 1, 2));
  const state = module.seed(),
    design = selected(state);
  const resized = act(
    state,
    "item.update",
    transform(design, design.items[1], { widthCm: 150 }),
  );
  assert.equal(
    quoteDesign(selected(resized), resized.catalog).lines.find(
      (line) => line.itemId === "item-2",
    ).amountSen,
    67500,
  );
  const more = act(resized, "item.add", {
    ...ref(selected(resized)),
    catalogId: "coffee-table",
    xCm: 280,
    zCm: 250,
  });
  const quote = quoteDesign(selected(more), more.catalog);
  assert.equal(quote.itemCount, 4);
  assert.equal(quote.furnitureSen, 310500);
  assert.equal(
    quote.lines.filter((line) => line.name === "Suri coffee table").length,
    2,
  );
});

test("manager price updates are optimistic, bounded and reflected in saved-design quotes", () => {
  const state = module.seed();
  const priced = act(
    state,
    "pricing.update",
    { version: 1, catalogId: "sofa", unitPriceSen: 200000 },
    "manager",
  );
  assert.equal(priced.pricingVersion, 2);
  assert.equal(
    quoteDesign(selected(priced), priced.catalog).furnitureSen,
    263000,
  );
  assert.deepEqual(priced.designs, state.designs);
  assert.throws(
    () =>
      act(
        priced,
        "pricing.update",
        { version: 1, catalogId: "sofa", unitPriceSen: 200000 },
        "manager",
      ),
    bad(409),
  );
  for (const value of [0, -1, 1.5, interiorLimits.priceSen + 1])
    assert.throws(
      () =>
        act(
          state,
          "pricing.update",
          { version: 1, catalogId: "sofa", unitPriceSen: value },
          "manager",
        ),
      bad(400),
    );
});

test("foreign design/catalog/item references and forged action fields never grant authority", () => {
  const state = module.seed(),
    design = selected(state);
  assert.throws(
    () => act(state, "design.load", { id: "foreign-design" }),
    bad(404),
  );
  assert.throws(
    () =>
      act(state, "item.add", {
        ...ref(design),
        catalogId: "foreign-product",
        xCm: 0,
        zCm: 0,
      }),
    bad(404),
  );
  assert.throws(
    () => act(state, "item.remove", { ...ref(design), itemId: "foreign-item" }),
    bad(404),
  );
  assert.throws(
    () =>
      act(state, "design.save", {
        ...ref(design),
        name: "Forged",
        workspaceId: "foreign",
      }),
    bad(400),
  );
  assert.throws(
    () =>
      act(state, "design.create", {
        name: "Forged",
        presetId: "foreign-preset",
      }),
    bad(404),
  );
});

test("design and item caps reject excess writes atomically and rolling history stays bounded", () => {
  const state = module.seed();
  for (let i = 1; i < interiorLimits.designs; i++)
    state.designs.push({
      ...structuredClone(state.designs[0]),
      id: `design-${i + 1}`,
    });
  assert.throws(
    () => act(state, "design.create", { name: "Overflow", presetId: "studio" }),
    bad(429),
  );
  assert.throws(
    () =>
      act(state, "design.duplicate", {
        ...ref(selected(state)),
        name: "Overflow",
      }),
    bad(429),
  );
  const separate = module.seed(),
    design = selected(separate);
  design.items = Array.from({ length: interiorLimits.items }, (_, i) => ({
    ...design.items[2],
    id: `lamp-${i}`,
  }));
  assert.throws(
    () =>
      act(separate, "item.add", {
        ...ref(design),
        catalogId: "chair",
        xCm: 300,
        zCm: 300,
      }),
    bad(429),
  );
  const history = module.seed();
  history.history = Array.from({ length: 100 }, (_, i) => ({
    id: `history-${i}`,
    at: new Date(now).toISOString(),
    event: "demo",
    detail: "Fictional history.",
  }));
  const saved = act(history, "design.save", {
    ...ref(selected(history)),
    name: "Bounded history",
  });
  assert.equal(saved.history.length, 100);
  assert.equal(saved.history[0].event, "design.save");
});
