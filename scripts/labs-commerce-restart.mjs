import { writeFile, readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../packages/database/index.ts";
import { commerceModule } from "../packages/commerce/index.ts";

loadLocalEnvironment("test");
if (
  !process.env.DATABASE_URL ||
  !new URL(process.env.DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Dedicated test database required");
const db = createDatabase(),
  repo = createRepository(db, commerceModule);
const file = ".local/postgresql/commerce-restart-proof.json";
const action = (packet, type, args = {}) => ({
  type,
  args,
  requestId: randomUUID(),
  generation: packet.generation,
  csrf: packet.csrf,
});
try {
  if (process.argv[2] === "prepare") {
    const { token, packet } = await repo.start();
    const cart = await repo.act(
      token,
      action(packet, "cart.set", { productId: "notebook", qty: 2, version: 0 }),
    );
    const request = action(cart, "checkout", {
      cartVersion: cart.state.cart.version,
      catalogVersion: cart.state.catalogVersion,
      code: "EVOLVE10",
      method: "QR",
      decline: false,
    });
    const order = await repo.act(token, request);
    const committed = await repo.act(
      token,
      action(order, "cart.set", {
        productId: "mug",
        qty: 1,
        version: order.state.cart.version,
      }),
    );
    await writeFile(file, JSON.stringify({ token, request, committed }), {
      flag: "wx",
      mode: 0o600,
    });
    console.log(
      "Commerce restart fixture saved privately. No tokens printed. Restart local PostgreSQL before verify.",
    );
  } else if (process.argv[2] === "verify") {
    const { token, request, committed } = JSON.parse(
      await readFile(file, "utf8"),
    );
    assert.deepEqual(await repo.read(token), committed);
    assert.deepEqual(await repo.act(token, request), committed);
    assert.equal(committed.state.orders.length, 1);
    assert.equal(committed.state.orders[0].totalSen, 3240);
    assert.equal(committed.state.cart.lines[0].productId, "mug");
    assert.equal(
      committed.state.products.find((p) => p.id === "notebook").onHand,
      22,
    );
    await unlink(file);
    console.log(
      "PASS: PostgreSQL restart preserved Commerce session, cart, order, stock and duplicate-checkout protection.",
    );
  } else throw new Error("Use prepare or verify");
} finally {
  await db.$disconnect();
}
