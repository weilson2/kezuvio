# M1/M2 implementation and local review

Closure update, 9 November 2026: the user accepted automated and manual testing, approved closing M1/M2, and authorized M3 Commerce Studio. Commit `0727252`, tag `labs-m1-m2-accepted-2026-11-09`. See [current progress and verified local backup](PROGRESS.md) and [M3 report](M3-REPORT.md). The dated implementation report below is historical.

7 November 2026, Asia/Kuala_Lumpur. **M1 and M2 completed and verified; stopped for user review.** Existing repository: `D:\WORKKK\kezuvio`. M1 passed its acceptance gate before M2 implementation began. No M3 work, public deployment, purchases, real payment processing or unrelated application changes.

## Delivered scope

M1 adds PostgreSQL-backed product/workspace sessions, typed repository/module interfaces, capability checks, filtered responses, versioned migrations, RLS and transactional writes. Session tokens are random and stored hashed; browser cookies are HttpOnly/SameSite Strict with product-specific paths. Workspaces expire after one hour; a longer-lived opaque cookie marker keeps expiry explicit in the UI. CSRF, origin/body validation, request quotas, bounded admission/cleanup and sanitized logs protect the demo boundary. Role selection is intentionally simulated within a visitor's workspace, not real staff authentication.

Every mutation derives product/workspace identity on the server. Row locking, durable request IDs and generation checks protect simultaneous writes and resets. Reset replaces only the selected product/workspace's fictional generation and rejects stale writes; a failed seed rolls back. Polling runs every five seconds while the tab is visible, with refresh/recovery after conflicts or uncertain network outcomes.

M2 adds `/demo/cafe-pos` and a separate link on `/demo`, preserving all six legacy demo URLs. Saji Café contains ten fictional sellable SKUs, six table links with real QR codes, a cart and customer order status, kitchen lanes, cashier shifts, simulated Cash/Card/QR payments, receipt printing, manager inventory adjustments, full refunds and gross/discount/refund/net reports. All views use the same persisted Cafe workspace.

Orders reserve stock atomically; settlement consumes reservations and physical stock once. A simulated decline has no financial/stock effect. Pre-preparation cancellation releases reservations; manager cancellation after preparation records waste. Refunds reverse payments once; only sealed, unprepared goods may be restocked. Money uses integer sen and half-up whole-order discounts shared between the server and preview. Cashier discounts are limited to 10%, manager discounts to 30%.

Persistence uses bounded per-workspace JSON aggregates in separate `platform` and `cafe` schemas, with composite identity constraints, RLS and database checks for nonnegative stock/reservations. The product module owns business rules outside React. This preserves the planned repository/product boundary while keeping the small demo's order, stock and payment commit atomic; it is not a normalized production POS schema.

## PostgreSQL provenance and isolation

- [Official Windows download page](https://www.postgresql.org/download/windows/) links [EDB's binary archives](https://www.enterprisedb.com/download-postgresql-binaries).
- Downloaded [PostgreSQL 18.6-5 Windows x64 ZIP](https://get.enterprisedb.com/postgresql/postgresql-18.6-5-windows-x64-binaries.zip), 384,620,317 bytes. Its SHA-256 matched the publisher's `.sha256`: `e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2` before extraction. This is publisher-checksum verification, not an Authenticode claim.
- Executables ran and reported 18.6 on Windows x64; actual initialization, connections, migrations, transactions and graceful restart were verified.
- Runtime, archive, cluster, logs and credentials live under `.local/postgresql/`, excluded from Git and Docker contexts. Windows ACLs limit access to the current user and SYSTEM. Nothing was installed globally or as a Windows service; no administrator installation, Docker or PATH changes.
- Server listens only on `127.0.0.1:55432`. Development database `kezuvio_labs_dev` and test database `kezuvio_labs_test` have separate owner/runtime roles. Runtime roles are non-owner and lack superuser, role creation, database creation, schema DDL and RLS bypass privileges.
- `.env.dev`/`.env.test` hold local migration and runtime settings. `.env.dev.runtime`/`.env.test.runtime` contain runtime-only settings; normal web startup reads the runtime-only file. Do not copy credentials into tracked files. Explicit process environment settings override local settings.
- Four migrations applied to both local databases. Migration reruns must be no-ops; the setup script refuses existing cluster/credential/database targets.

## Local start and review

From PowerShell in the existing repository. These direct executable commands work even when PowerShell script execution is disabled; no execution-policy change is needed:

```powershell
cd D:\WORKKK\kezuvio
& .\.local\postgresql\runtime\pgsql\bin\pg_ctl.exe status -D .\.local\postgresql\data
# If stopped:
& .\.local\postgresql\runtime\pgsql\bin\pg_ctl.exe start -D .\.local\postgresql\data -l .\.local\postgresql\server.log -w
# Only needed after migration/source changes:
npm.cmd run db:migrate
npm.cmd run build
# Ordinary review startup uses the existing build:
npm.cmd run start
```

Open `http://127.0.0.1:3000/demo/cafe-pos?table=4`. Use `npm.cmd run dev` instead of build/start when editing. Do not rerun `setup` on this initialized cluster. To stop PostgreSQL after stopping the web process, run `& .\.local\postgresql\runtime\pgsql\bin\pg_ctl.exe stop -D .\.local\postgresql\data -m smart -w` (graceful smart shutdown). No deletion/reset of the database is needed for ordinary operation. Using `npm.cmd` also avoids PowerShell selecting the `npm.ps1` wrapper.

8 November startup correction: the user's shell blocked `postgres-local.ps1` with `PSSecurityException`. Direct `pg_ctl.exe start` succeeded and `pg_isready.exe -h 127.0.0.1 -p 55432` reported accepting connections. The execution policy was not changed; no database files were replaced.

Review workflow:

1. Customer: add two **Kopi susu · Iced** and place the table order (RM15.00).
2. Kitchen: advance the same ticket through Preparing, Ready and Served.
3. Cashier: open a shift with RM100.00, use a 10% discount and RM20.00 cash tender. Amount due is RM13.50; change is RM6.50. Optionally simulate a decline first, then Refresh before retrying.
4. Print/reprint the sample receipt using the browser print dialog. Cancelling printing does not affect the sale.
5. Manager: inventory shows 18 iced coffees with zero reserved; net sales show RM13.50. Adjust stock with a note, or issue a full no-restock refund and inspect reports.
6. Reset demo, then Confirm reset: orders/shifts/movements clear and stock returns to samples. Other visitors/products remain unchanged.

Role changes apply across tabs in the same workspace; open another tab in the same browser to observe synchronized views. Another browser context gets a separate workspace. QR links identify tables, never transfer workspace secrets. With the required localhost-only setup, a phone cannot join this desktop's workspace by scanning it; multi-device access/authentication is outside this milestone.

## Verification

M1 gate before M2: 27 platform tests; 4 platform browser/API tests; 9 legacy domain and 53 legacy browser/API tests; build, typecheck and brand checks passed. The actual graceful database stop/start proof (`labs-restart-check.mjs prepare` then `verify`) confirmed session, state and duplicate history durability.

Final M2 verification on Windows, against the fresh production build:

| Command/check | Actual result |
| --- | --- |
| `npm run db:migrate` and `npm run db:migrate:test` | Both pass; four migrations found, no pending migrations; runtime grants verified |
| `npm run test:platform` | 27 passed (7 domain + 20 real PostgreSQL tests) |
| `npm run test:cafe` | 30 passed (21 domain + 9 real PostgreSQL tests) |
| `npm run build` | Pass; generated Prisma client and all existing/new routes |
| `npm run typecheck` | Pass |
| `npm run test:labs` | 14 passed in 40.9s (10 Cafe + 4 foundation browser/API journeys) |
| `npm run test:labs -- --grep "table ordering"` | 1 passed after extending that journey with keyboard stock adjustment and reload persistence |
| `npm test` | Brand checks pass; 9 legacy domain + 53 browser/API tests pass (browser suite 34.3s) |
| Ordinary `npm run start` smoke check | Cafe session returns200 using runtime-only local environment; acceptance fixture page/API return404 |
| Git checks | `.local` credentials/data ignored; `git diff --check` passes; existing unrelated edits preserved |

**133 distinct automated tests passed**, plus the extended workflow rerun, build/typecheck, migration and runtime checks. Cafe coverage includes reservation/settlement/reset races, duplicate settlement and mismatched request intent, rejected payment rollback, stale generation, cross-workspace/product isolation, permissions, prepared-item waste, refunds, shifts, real QR decoding and untrusted Host handling. Browser journeys verify persisted reloads, lost-response recovery without duplicated orders, synchronized tabs, receipt printing, stock adjustment by keyboard and scoped reset.

Cafe accessibility and overflow checks cover every role and all manager views at 375/768/1440px in both themes. Screenshots were visually inspected: [desktop menu](../previews/cafe-m2/desktop-menu.png), [mobile dark menu](../previews/cafe-m2/mobile-menu-dark.png), [dark inventory](../previews/cafe-m2/desktop-inventory-dark.png), [print receipt](../previews/cafe-m2/receipt-print.png). The receipt shows RM15.00 subtotal, RM1.50 discount, RM13.50 total and RM6.50 change, with no surrounding application controls in print media.

Initial M2 browser run exposed two test assumptions: the simulated decline correctly requires Refresh before another action, and the Kitchen navigation accessible name includes its ticket count. Corrected those test steps/selectors and reran all 14 successfully. No unresolved acceptance failures remain. Hardware printer output, phone/LAN use, hosted CI and public hosting were not tested or enabled. Print invocation and CSS were tested; no physical printer or operating-system print-dialog automation is claimed.

The dedicated acceptance preview uses `127.0.0.1:3100` and the test database, with fixture-only routes enabled by `LABS_ACCEPTANCE_MODE=1`. Temporary web previews were stopped after verification. PostgreSQL was then gracefully stopped with `scripts/postgres-local.ps1 stop`; all data remains on disk. Use the start commands above for review.

```powershell
npm run db:migrate
npm run db:migrate:test
npm run test:platform
npm run test:cafe
npm run build
npm run typecheck
npm run test:labs
npm test
```

CI now prepares a PostgreSQL 18 service with separate test owner/runtime roles, applies migrations and runs platform/Cafe tests plus browser acceptance. Hosted CI has not been executed in this local task.

## Changed files

- Platform/database: `packages/demo-platform/{package.json,index.ts}`, `packages/database/{package.json,environment.ts,index.ts,prisma/schema.prisma,prisma/migrations/**}`, `prisma.config.ts`.
- Cafe domain: `packages/cafe/{package.json,index.ts,pricing.ts}`.
- Website integration: `apps/website/lib/labs/server.ts`, `app/api/labs/[product]/{session,action}/route.ts`, `app/api/labs/cafe-pos/qr/route.ts`, `app/demo/{cafe-pos,platform-check}/page.tsx`, `app/demo/page.tsx`, and `components/labs/{platform-shell.tsx,labs.css,cafe-workspace.tsx,cafe.css}` under `apps/website/`.
- Tooling: `scripts/postgres-local.ps1`, `scripts/labs-{db,preview,ci-setup,restart-check}.mjs`, root `package.json`/lockfile, `apps/website/tsconfig.json`, `playwright.config.ts`, `playwright.labs.config.ts`, `.github/workflows/ci.yml`, `.gitignore`, `.dockerignore`.
- Tests: `tests/labs/{platform-domain.test.mjs,platform-db.test.mjs,platform.spec.ts,cafe-domain.test.mjs,cafe-db.test.mjs,cafe.spec.ts}`.
- Documentation: this report, `docs/six-products/{M1-STATUS,PHASE-0,BACKLOG,ARCHITECTURE}.md`, README link and four screenshots under `docs/previews/cafe-m2/`. Earlier Phase 0 planning files remain in the existing uncommitted tree.

Pre-existing website layout edits, navigation-scroll tests, Ledger Lite application and ledger scripts were preserved. No commits or deployment were made. Generated brand assets were regenerated by the standard build and remain unchanged in Git.

## Limits, costs and next decision

This is a local fictional demo. It has no real staff/customer authentication, payment provider, fiscal/tax compliance, ingredient recipes, printer hardware integration, offline POS, external messaging, multi-branch operations or production backup/monitoring. Sellable SKU counts are intentionally used for inventory. Viewer receives summary totals only. Expiry cleanup is opportunistic when creating workspaces, with bounded batches, rather than a background scheduler.

Demo limits: 500 active workspaces, 300 new sessions/minute globally, 120 session requests/minute, 500 actions/generation, up to 100 generations, 50 orders, 100 shifts, 2,000 movements and 256KB stored state. A new workspace/reset is the intended recovery when demo limits are reached. Persistent storage survives process restart until expiry; the original six demos retain their in-memory behavior.

Incremental service/license cost: **RM0**. No paid service or deployment was created. Existing hardware, electricity and the user's existing agent subscription are excluded; no extra agent credits were purchased. PostgreSQL and dependencies use open-source licenses. There is no recurring hosting cost for this local implementation. Any future hosting, real authentication/payment integration or architectural expansion requires a new scope/approval; prior Phase 0 hosting estimates are uncommitted planning reserves, not charges.

Implementation is stopped for user review. M3 and other products remain untouched.
