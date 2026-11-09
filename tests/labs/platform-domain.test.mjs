import test from "node:test";
import assert from "node:assert/strict";
import {
  LabsError,
  assertRole,
  constantEqual,
  integer,
  newToken,
  platformFixture,
  requestHash,
  tokenHash,
  validRole,
  validateAction,
} from "../../packages/demo-platform/index.ts";

const actor = (role) => ({ role, customerId: "fictional-customer" });
const action = (overrides = {}) => ({
  type: "fixture.consume",
  args: {},
  requestId: "51b4579b-53e3-4825-8e81-af6d68fb765e",
  generation: 1,
  csrf: "a".repeat(64),
  ...overrides,
});
const failsWith = (status) => (error) =>
  error instanceof LabsError && error.status === status;

test("action validation accepts the exact shape and returns detached JSON arguments", () => {
  const source = action({ args: { nested: [{ value: 5 }] } });
  const result = validateAction(source);
  assert.deepEqual(result, source);
  result.args.nested[0].value = 9;
  assert.equal(source.args.nested[0].value, 5);
});

test("action validation rejects malformed, oversized and unsafe input", () => {
  const invalid = [
    null,
    [],
    {},
    action({ unexpected: true }),
    action({ type: "../reset" }),
    action({ args: [] }),
    action({ requestId: "not-a-uuid" }),
    action({ csrf: "" }),
    action({ generation: 0 }),
    action({ generation: 1.5 }),
    action({ generation: Infinity }),
    action({ args: { missing: undefined } }),
    action({ args: { notFinite: NaN } }),
    action({ args: { when: new Date() } }),
    action({ args: { value: BigInt(1) } }),
    action({ args: JSON.parse('{"__proto__":{"manager":true}}') }),
    action({ args: { large: "x".repeat(65_537) } }),
    action({ args: { values: new Array(10_001).fill(1) } }),
    action({ args: { values: new Array(2) } }),
  ];
  const recursive = {};
  recursive.again = recursive;
  invalid.push(action({ args: recursive }));
  for (const input of invalid)
    assert.throws(() => validateAction(input), failsWith(400));
});

test("idempotency hashes canonical intent independently of key order and transport metadata", () => {
  const first = action({ args: { z: 1, a: { b: 2, a: 3 } } });
  const second = action({
    args: { a: { a: 3, b: 2 }, z: 1 },
    requestId: "different",
    csrf: "different",
  });
  assert.equal(requestHash(first), requestHash(second));
  assert.notEqual(requestHash(first), requestHash({ ...first, generation: 2 }));
  assert.notEqual(
    requestHash(first),
    requestHash({ ...first, type: "fixture.note" }),
  );
  assert.notEqual(
    requestHash(first),
    requestHash({ ...first, args: { z: 2 } }),
  );
  assert.notEqual(
    requestHash(action({ args: { list: [1, 2] } })),
    requestHash(action({ args: { list: [2, 1] } })),
  );
});

test("session token utilities use random 256-bit tokens and SHA-256 digests", () => {
  const first = newToken();
  const second = newToken();
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.notEqual(first, second);
  assert.equal(
    tokenHash("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(constantEqual(first, first), true);
  assert.equal(constantEqual(first, second), false);
  assert.equal(constantEqual(first, "short"), false);
  assert.equal(constantEqual("é", "ee"), false);
});

test("roles and integer bounds reject unauthorized or imprecise values", () => {
  for (const role of ["customer", "kitchen", "cashier", "manager", "viewer"])
    assert.equal(validRole(role), true);
  for (const role of ["admin", "", null, {}, 1])
    assert.equal(validRole(role), false);
  assert.doesNotThrow(() => assertRole("manager", ["manager"]));
  assert.throws(() => assertRole("viewer", ["manager"]), failsWith(403));
  assert.equal(integer(1, "quantity", 1, 5), 1);
  assert.equal(integer(5, "quantity", 1, 5), 5);
  for (const value of [
    -1,
    0,
    6,
    1.1,
    "2",
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    assert.throws(() => integer(value, "quantity", 1, 5), failsWith(400));
  }
});

test("fixture mutations authorize roles, remain pure and enforce exhausted stock", () => {
  const seed = Object.freeze(platformFixture.seed());
  for (const role of ["customer", "kitchen", "viewer"]) {
    assert.throws(
      () => platformFixture.reduce(seed, action(), actor(role)),
      failsWith(403),
    );
  }
  const consumed = platformFixture.reduce(seed, action(), actor("cashier"));
  assert.equal(consumed.stock, 0);
  assert.equal(consumed.consumed, 1);
  assert.equal(consumed.totalSen, 1000);
  assert.equal(seed.stock, 1);
  const snapshot = structuredClone(consumed);
  assert.throws(
    () => platformFixture.reduce(consumed, action(), actor("manager")),
    failsWith(409),
  );
  assert.deepEqual(consumed, snapshot);
  assert.throws(
    () =>
      platformFixture.reduce(
        seed,
        action({ args: { amount: -1 } }),
        actor("manager"),
      ),
    failsWith(400),
  );
});

test("fixture notes remain manager-only and projections cannot mutate stored state", () => {
  const seed = platformFixture.seed();
  const note = action({
    type: "fixture.note",
    args: { note: "Private fictional note" },
  });
  for (const role of ["customer", "kitchen", "cashier", "viewer"]) {
    assert.throws(
      () => platformFixture.reduce(seed, note, actor(role)),
      failsWith(403),
    );
    assert.equal(
      "managerNote" in platformFixture.project(seed, actor(role)),
      false,
    );
  }
  assert.equal(
    "totalSen" in platformFixture.project(seed, actor("kitchen")),
    false,
  );
  const changed = platformFixture.reduce(seed, note, actor("manager"));
  assert.equal(changed.managerNote, "Private fictional note");
  const projection = platformFixture.project(changed, actor("manager"));
  projection.managerNote = "Changed outside module";
  assert.equal(changed.managerNote, "Private fictional note");
  assert.equal(seed.managerNote, "Fictional manager note");
  assert.throws(
    () =>
      platformFixture.reduce(
        seed,
        action({ type: "fixture.note", args: { note: "x", extra: 1 } }),
        actor("manager"),
      ),
    failsWith(400),
  );
  assert.throws(
    () =>
      platformFixture.reduce(
        seed,
        action({ type: "unknown.action" }),
        actor("manager"),
      ),
    failsWith(400),
  );
});
