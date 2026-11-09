# Architecture proposal

Status: proposed for the new six-product programme, not implemented. Retain the current npm monorepo and use one Next.js Node deployment initially. Six independent business modules need not mean six deployments. The existing website and Flutter application remain separate products.

Implementation update, 7 November: M1/M2 use these product/schema/repository boundaries. See the [current implementation report](M1-M2-REPORT.md) for actual behavior and verification. Demo business rows are bounded JSON aggregates with database stock checks, locked transactionally per workspace; replay returns the current authorized projection rather than storing/replaying privileged response payloads. Future products and production architecture below remain proposals.

## Proposed layout

```text
apps/website/                       existing marketing and legacy demo routes
  app/demo/cafe-pos/                first new integrated product
  app/demo/{automation-hub,commerce-studio,property-crm,accounting-cloud,interior-3d}/
  app/api/labs/[product]/           new product API boundary
  components/labs/                 product screens, separate from legacy demos
apps/worker/                       deferred until queue work needs its own process
apps/ledger_lite/                  existing independent Flutter app, preserved
packages/brand/                    existing tokens/assets
packages/ui/                       existing accessible React primitives
packages/demo-platform/            session identity, scope, expiry, error/log contracts
packages/database/                Prisma schemas, migrations, product repositories
packages/cafe/                     first pure domain package
packages/{commerce,automation,property,accounting,interior}/  added per milestone
tests/labs/                        API, persistence, concurrency and browser coverage
```

This is a target map, not a set of empty scaffold packages to create at once. Give new packages proper manifests/exports when introduced. Preserve existing TypeScript aliases until consumers are migrated. Keep the old `/api/demo` and its reset behavior compatible; new clients exclusively use `/api/labs`.

## Stack decisions

| Component | Decision and compatibility evidence |
| --- | --- |
| Next.js/TypeScript/React | Retain installed lockfile versions for M1. Read bundled Next.js docs before edits; use App Router route handlers with Node runtime for DB access. [Official route handlers](https://nextjs.org/docs/app/getting-started/route-handlers) |
| UI | Retain shared CSS/tokens first. Add Tailwind/shadcn only for demonstrated component needs, scoped so resets do not restyle legacy pages. Preferred stack is not a reason to rewrite a working design system. [Tailwind](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [shadcn](https://ui.shadcn.com/docs/installation/next) |
| PostgreSQL/Prisma | Proposed PostgreSQL 18 stable baseline and Prisma 7 family, exact compatible versions pinned after install verification. Existing Node 24 satisfies documented Prisma minimum. Use migrations and a disposable integration-test database. [Requirements](https://www.prisma.io/docs/orm/reference/system-requirements) |
| Tests | Keep existing Node tests and Playwright; add Vitest for new domain packages if its workspace benefits justify the dependency. Do not migrate passing tests solely for uniformity. [Vitest](https://vitest.dev/guide/) |
| Queue | Defer Redis/BullMQ. Start deterministic work as durable PostgreSQL tasks invoked by explicit demo actions. Later asynchronous processing uses an outbox, retries and scoped job IDs. [BullMQ](https://docs.bullmq.io/) |
| 3D | React Three Fiber 9 family pairs with React 19; pin compatible Three.js/drei versions when M7 starts. Avoid alpha WebGPU dependencies for the first demo. [R3F compatibility](https://r3f.docs.pmnd.rs/getting-started/introduction) |
| Infrastructure | Extend existing Docker/CI only when the DB-backed app exists; no deployment in this phase |

Before each new install: inspect official package owner/repository, release/version, license, engine/peer constraints and install scripts; pin resolved versions in the lockfile; review advisory output and test compatibility. Current documentation is not a guarantee that this exact installed TypeScript/React combination works with every new package. No dependency was installed in Phase 0.

## Isolation and persistence

One PostgreSQL instance, with `platform`, `cafe`, `automation`, `commerce`, `property`, `accounting` and `interior` schemas. Prisma supports multi-schema modeling, but namespaces alone do not enforce security. [Prisma multi-schema](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema).

The platform holds hashed opaque session tokens and product workspace membership. Each product owns its tables and repository interface; there are no direct cross-product business-table queries or shared stock. A workspace belongs to exactly one product. Application roles have access only to required schemas; migration credentials are separate and unavailable to request handlers.

Every mutable record includes `workspaceId`, `generation`, `id`, version/timestamps as appropriate. Product identity is fixed by the server route and repository; workspace is derived from the session, never accepted as authority from client JSON. Child foreign keys include workspace and generation to reject cross-workspace associations. List queries, aggregate reports, exports, audit events, idempotency and jobs follow the same scope.

Add row-level policies as defense in depth. Use a non-owner runtime role without BYPASSRLS and force RLS where appropriate; set workspace context transaction-locally so connection pooling cannot leak it. Test with the actual runtime role, not the migration user. PostgreSQL documents that owners/superusers can bypass ordinary policies. [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

For a single Next.js process, product-specific DB clients enforce normal query boundaries; process compromise is not isolated. A future production split can deploy modules with separate credentials/processes/databases. This demo architecture must not be advertised as hard multi-tenant production isolation before verification.

## Session and authorization contract

- A visitor starts a fictional workspace per product. Cookies are opaque, HttpOnly, Secure under HTTPS and SameSite Strict; narrow cookie paths and names avoid collisions with legacy APIs.
- Fixed one-hour demo expiry; show expiry and an explicit restart action. No real employee login is implied.
- Cafe roles: customer creates/views own table orders; kitchen reads tickets and advances preparation; cashier settles sales/prints; manager manages catalog/stock, refunds and reports. Viewer reads permitted summaries only.
- Role switching is an explicit labeled simulation confined to a private visitor workspace. Every endpoint still checks capability and returns only permitted fields. Production authentication is a separate future deliverable.
- Mutations use exact origin checks, CSRF tokens, schema validation, bounded payloads/records and server rate limits. Keep identifiers opaque and return typed, sanitized errors.
- Structured logs contain request ID, product, pseudonymous workspace, action, latency and result; omit cookies, tokens, enquiry text and personal data. Audit entries are transactionally written, distinct from diagnostic logs.

## Transactions and resets

Use integer sen; select one documented rounding rule for percentage discounts and taxes (no tax integration in the demo). Idempotency is unique on product/workspace/generation/request ID and stores an input hash plus response. A reused key with changed input is rejected. Retain keys for the entire generation so retries after restart remain safe.

Serialize inventory, settlement and reset conflicts through transactional locks/version checks. Unique constraints enforce one payment and one reversal per eligible sale; retry only documented transient DB conflicts. An outbox later publishes committed business events without double-posting effects.

Reset algorithm:

1. Authenticate the target product workspace and confirm reset in the UI; request carries its expected generation.
2. Lock the workspace row. Validate generation and session. All mutations acquire the same workspace lock before changing business state.
3. Increment generation and seed a new dataset from a versioned deterministic fixture, inside one transaction. Commit only when all fixture invariants pass; rollback leaves the previous workspace intact.
4. Return new generation and force clients to reload. Concurrent old requests fail with a stale-generation response; old idempotency keys cannot execute against the new generation.
5. Mark old-generation jobs invalid; workers recheck generation before processing and before committing. Remove old records/assets in bounded cleanup after commit. Never truncate a shared product schema.

Expiry cleanup uses the same scoped protocol. Quotas cap workspace count, rows, jobs and 3D design size. Verify reset racing with checkout, stale tabs, cleanup and workers. Record counts of removed data without logging contents.

## Cafe domain contract

Entities: menu item/variant, sellable-unit stock, table, order/lines, kitchen ticket, payment, receipt, shift, inventory movement and audit entry. Ingredient recipes and physical printer integration are later work.

At order acceptance, reserve available sellable units atomically and create one ticket. Repeated submit returns the same result. Kitchen status moves Received → Preparing → Ready → Served. Payment status is separate from kitchen status. Cashier may settle a non-cancelled accepted order once in an open shift; mock failure leaves the order unpaid. Successful payment converts reservation into a stock sale movement and updates the shift/report atomically. A receipt preview/print retry has no financial side effect.

For unpaid orders still Received, the owning customer, cashier or manager may cancel and release reservations. Once preparation starts, only a manager may cancel an unpaid order: release its reservation and subtract the same quantity from on-hand as waste, never make prepared goods available again. Paid orders use the refund path, not unpaid cancellation. Cancellation and settlement acquire the same locks, so only one can win; cancelled orders cannot settle. Manual stock adjustments cannot set on-hand below existing reservations.

M2 supports one full refund per payment; partial refunds are deferred. Only managers can refund. Prepared cafe items cannot be restocked; for eligible unprepared or packaged goods, the manager explicitly chooses restock or no-restock. A refund ends further kitchen processing. The payment reversal and any stock return post exactly once, with no second waste deduction for stock already consumed at settlement. Expiry/reset discards only fictional data. Quantities, stock and all monetary totals stay bounded and validated server-side.

Example acceptance fixture: two iced coffees at RM7.50 each, 10% discount, RM20 cash → RM13.50 payable, RM6.50 change. Submit reserves two; settle consumes two once. Refund reduces net sales by RM13.50; no-restock keeps physical on-hand unchanged. Separate tests cover restockable retail items.

## Accounting approach

Use a new journal domain. Posted entries are immutable and balanced; corrections create reversal entries. Store explicit chart-of-account classification, dates, document links, debit/credit lines and source idempotency. Customer/supplier balances derive from subledger control accounts; invoice and payment must not both recognize the same revenue. Reports reconcile to a single journal snapshot.

M6 chooses and documents accrual semantics and weighted-average inventory costing with deterministic integer rounding. Opening balances, purchases, sales/COGS, expenses, receivables/payables, payments and refunds have worked fixtures. Bank matching is one-to-one with explicit unmatched lines; reconciliation never fabricates balancing journals. Tax rates/e-Invoice/LHDN compliance remain out of scope. Qualified accounting review is needed before real-business use.

## Deployment and rollback plan

Local first: one Next.js Node process plus PostgreSQL; optional Compose once Docker is available. Production-like integration tests must use PostgreSQL, not substitute SQLite. CI provisions isolated PostgreSQL, applies migrations, runs domain/API/concurrency/browser checks and retains failure traces.

After separate hosting approval: select a region/provider, configure secret env vars, apply tested additive migrations, seed synthetic data only, check TLS/origin/cookies and capacity, then smoke-test visitor isolation and reset. Public portfolio links become live only when a deployment is verified. Database backups need a demonstrated restore; rollbacks use prior compatible app images and forward fixes for migrations. Do not claim the existing Dockerfile/CI has validated this future topology.
