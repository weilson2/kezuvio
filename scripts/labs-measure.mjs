import { writeFile, mkdir } from "node:fs/promises";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../packages/database/index.ts";
import { tokenHash } from "../packages/demo-platform/index.ts";
import { cafeModule } from "../packages/cafe/index.ts";
import { commerceModule } from "../packages/commerce/index.ts";
import { automationModule } from "../packages/automation/index.ts";
import { propertyModule } from "../packages/property/index.ts";
import { accountingModule } from "../packages/accounting/index.ts";
import { interiorModule } from "../packages/interior/index.ts";
loadLocalEnvironment("test");
if (!new URL(process.env.DATABASE_URL).pathname.endsWith("_test"))
  throw new Error("Test database required");
const db = createDatabase();
const modules = [
  cafeModule,
  commerceModule,
  automationModule,
  propertyModule,
  accountingModule,
  interiorModule,
];
const tables = [
  "cafe",
  "commerce",
  "automation",
  "property",
  "accounting",
  "interior",
];
const results = [];
const nodes = (plan) => [plan, ...(plan.Plans || []).flatMap(nodes)];
try {
  for (const [index, module] of modules.entries()) {
    const repo = createRepository(db, module),
      session = await repo.start(),
      samples = [];
    for (let i = 0; i < 10; i++) {
      const begin = performance.now();
      await repo.read(session.token);
      samples.push(performance.now() - begin);
    }
    samples.sort((a, b) => a - b);
    const explain = await db.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(
        "SELECT set_config('labs.workspace',$1,true),set_config('labs.product',$2,true),set_config('labs.generation',$3,true),set_config('labs.token',$4,true)",
        session.packet.workspaceId,
        module.id,
        String(session.packet.generation),
        tokenHash(session.token),
      );
      return tx.$queryRawUnsafe(
        `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT state FROM ${tables[index]}.documents WHERE workspace_id=$1::uuid AND product=$2 AND generation=$3`,
        session.packet.workspaceId,
        module.id,
        session.packet.generation,
      );
    });
    const plan = explain[0]["QUERY PLAN"][0];
    results.push({
      product: module.id,
      samples: samples.length,
      readP50Ms: samples[4],
      readP95Ms: samples[9],
      planNodes: nodes(plan.Plan).map((node) => node["Node Type"]),
      indexes: [
        ...new Set(
          nodes(plan.Plan)
            .map((node) => node["Index Name"])
            .filter(Boolean),
        ),
      ],
      actualRows: plan.Plan["Actual Rows"],
      planningMs: plan["Planning Time"],
      executionMs: plan["Execution Time"],
    });
  }
  await mkdir("docs/previews/m11", { recursive: true });
  await writeFile(
    "docs/previews/m11/database-measurement.json",
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        conditions:
          "Local Windows PostgreSQL18.6 dedicated test database, warm sequential reads, existing bounded aggregate dataset; no concurrent load test or production capacity inference.",
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results));
} finally {
  await db.$disconnect();
}
