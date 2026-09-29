import { randomUUID } from "node:crypto";
import { readFile, writeFile, unlink } from "node:fs/promises";
import assert from "node:assert/strict";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../packages/database/index.ts";
import { cafeModule } from "../packages/cafe/index.ts";
import { commerceModule } from "../packages/commerce/index.ts";
import { automationModule } from "../packages/automation/index.ts";
import { propertyModule } from "../packages/property/index.ts";
import { accountingModule } from "../packages/accounting/index.ts";
import { interiorModule } from "../packages/interior/index.ts";
loadLocalEnvironment("test");
const url = new URL(process.env.DATABASE_URL);
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "55432");
assert.equal(url.pathname, "/kezuvio_labs_test");
const modules = [
  cafeModule,
  commerceModule,
  automationModule,
  propertyModule,
  accountingModule,
  interiorModule,
];
const db = createDatabase();
const repositories = modules.map((module) => createRepository(db, module));
const file = ".local/postgresql/six-product-recovery-proof.json";
const intent = (packet, type, args = {}) => ({
  type,
  args,
  generation: packet.generation,
  csrf: packet.csrf,
  requestId: randomUUID(),
});
const keys = [
  ["menu", "orders"],
  ["cart", "orders", "products"],
  ["inquiries", "tasks", "quotes"],
  ["listings", "leads", "history"],
  ["journals", "documents"],
  ["designs", "pricing"],
];
const business = (packet, index) =>
  Object.fromEntries(
    keys[index]
      .filter((key) => packet.state[key] !== undefined)
      .map((key) => [key, packet.state[key]]),
  );
function mutation(packet, index) {
  if (index === 0)
    return intent(packet, "order.submit", {
      table: 4,
      lines: [{ itemId: "kopi-iced", qty: 2 }],
    });
  if (index === 1)
    return intent(packet, "cart.set", {
      productId: "notebook",
      qty: 2,
      version: packet.state.cart.version,
    });
  if (index === 2)
    return intent(packet, "inquiry.submit", {
      businessName: "Fictional recovery studio",
      contactName: "Sample Visitor",
      email: "recovery@example.test",
      brief: "A fictional website with booking and reporting requirements.",
      budgetSen: 400000,
      timelineWeeks: 8,
    });
  if (index === 3)
    return intent(packet, "lead.create", {
      contactId: "contact-1",
      listingId: "listing-1",
      agentId: "agent-1",
      source: "Local recovery rehearsal",
      notes: "Fictional persistence fixture.",
    });
  if (index === 4)
    return intent(packet, "transaction.post", {
      kind: "Income",
      date: packet.state.today,
      memo: "Fictional recovery income",
      partyId: null,
      dueDate: null,
      amountSen: 12345,
    });
  const design = packet.state.designs.find(
    (item) => item.id === packet.state.selectedDesignId,
  );
  return intent(packet, "design.save", {
    id: design.id,
    version: design.version,
    name: "Fictional recovered room",
  });
}
try {
  if (process.argv[2] === "prepare") {
    const fixtures = [];
    for (const [index, repo] of repositories.entries()) {
      const session = await repo.start();
      let packet = session.packet;
      if ([3, 4].includes(index))
        packet = await repo.act(
          session.token,
          intent(packet, "role", { role: "manager" }),
        );
      const request = mutation(packet, index);
      packet = await repo.act(session.token, request);
      fixtures.push({
        token: session.token,
        request,
        generation: packet.generation,
        workspaceId: packet.workspaceId,
        expected: business(packet, index),
      });
    }
    await writeFile(file, JSON.stringify(fixtures), {
      flag: "wx",
      mode: 0o600,
    });
    console.log(
      "Prepared six fictional product mutations and duplicate requests in the dedicated test database. Restart PostgreSQL gracefully, then verify.",
    );
  } else if (process.argv[2] === "verify") {
    const fixtures = JSON.parse(await readFile(file, "utf8"));
    for (const [index, repo] of repositories.entries()) {
      const fixture = fixtures[index];
      for (const packet of [
        await repo.read(fixture.token),
        await repo.act(fixture.token, fixture.request),
      ]) {
        assert.equal(packet.workspaceId, fixture.workspaceId);
        assert.equal(packet.generation, fixture.generation);
        assert.deepEqual(business(packet, index), fixture.expected);
      }
    }
    for (const [index, repo] of repositories.entries()) {
      const fixture = fixtures[index],
        packet = await repo.read(fixture.token);
      const reset = await repo.act(fixture.token, intent(packet, "reset"));
      assert.equal(reset.generation, fixture.generation + 1);
      await assert.rejects(
        repo.act(fixture.token, fixture.request),
        (error) => error.status === 409,
      );
      for (let other = index + 1; other < repositories.length; other++)
        assert.deepEqual(
          business(
            await repositories[other].read(fixtures[other].token),
            other,
          ),
          fixtures[other].expected,
        );
    }
    await unlink(file);
    console.log(
      "PASS: all six product mutations, visitor sessions and idempotent replay survived PostgreSQL restart; sequential resets rejected stale writes and preserved other products.",
    );
  } else throw new Error("Use prepare or verify");
} catch (error) {
  console.error(
    "Six-product recovery rehearsal failed; inspect private fixtures and local database. No credentials logged.",
  );
  console.error(
    error instanceof assert.AssertionError
      ? error.message.slice(0, 500)
      : error.message,
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
