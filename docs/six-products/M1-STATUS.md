# M1 execution status

6 November 2026, Asia/Kuala_Lumpur. **M1 completed and verified. M2 is now authorized to begin.**

7 November update: M2 is also complete; see the [final M1/M2 implementation and testing report](M1-M2-REPORT.md). The M1 gate evidence below records the checks completed before Cafe implementation.

## Completed implementation and acceptance

- PostgreSQL 18.6 x64 downloaded from EDB through the official PostgreSQL site's binary link. SHA-256 matched `e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2`; executables run on Windows x64. No administrator installation, Windows service, Docker or global PATH change.
- Local data/runtime/credentials are under Git-ignored `.local/postgresql/`; credentials and data inherit current-user/SYSTEM-only ACLs. PostgreSQL listens at `127.0.0.1:55432` with separate `kezuvio_labs_dev` and `kezuvio_labs_test`, separate owner/runtime roles and SCRAM authentication.
- Prisma migrations, product/workspace-scoped repository, RLS, hashed sessions, capability projections, transactional mutations, durable idempotency, generation-aware reset, quotas and bounded expiry cleanup implemented. API boundaries and a reusable accessible shell are present; the fixture UI/API requires `LABS_ACCEPTANCE_MODE=1`.
- Exact checks: `npm run test:platform` **27 passed**; `npm run test:labs` **4 passed**; `npm test` **9 legacy domain + 53 legacy browser/API tests passed**, plus brand checks; `npm run typecheck` and `npm run build` passed. Migration rerun reported no pending migrations.
- `node scripts/labs-restart-check.mjs prepare`, a graceful stop/start of this cluster, and `node scripts/labs-restart-check.mjs verify` passed: sessions, committed data and duplicate protection survived an actual database restart.
- Initial failures were corrected: advisory lock result casting for Prisma, UTC/database-clock expiry, Node test cleanup registration, and a browser test locator conflicting with Next's route announcer. No failing M1 acceptance remains.
- CI service/job is prepared but has not been executed on GitHub. Local evidence is from Windows/PostgreSQL, not hosted CI.
- Incremental service/license spending: RM0. No deployment, paid service, real payment or unrelated app change.

Implementation detail: each product repository stores a bounded aggregate snapshot in its own schema, with normalized platform session/request/audit rows and workspace foreign keys. All aggregate changes run under a workspace row lock and one transaction; product reducers validate internal order/stock relationships. This preserves the planned database and module boundaries without introducing separate ORM tables for every internal demo line item. The existing legacy in-memory demos remain intact.

The earlier setup investigation below is retained as history; its pending installation choice is resolved by the user's subsequent Option 1 approval.

The user approved Phase 0 and authorized M1 plus M2 only. M2 must wait for passing M1 acceptance tests. No further approval of those milestones is needed. The user separately requires installation options before proceeding when suitable local PostgreSQL is unavailable.

## Initial environment check

- Inspected current Git status, root and website AGENTS.md, architecture and acceptance backlog. Existing uncommitted files remain untouched.
- `Get-Command` found no `psql`, `pg_ctl`, `postgres`, Docker or Podman on PATH.
- No PostgreSQL installation was found in the inspected standard Windows directories, PostgreSQL installation registry keys, or matching immediate subdirectories of the inspected local tools/development directories.
- No PostgreSQL process was returned by the process-name check. TCP probes to `127.0.0.1:5432` and `127.0.0.1:5433` could not connect.
- Windows service enumeration and WSL distribution enumeration were denied by the current execution environment. An installation in an uninspected location, inaccessible service or WSL distribution cannot be ruled out. No usable local database is verified.

## Installation choice pending

1. Recommended for this task: PostgreSQL 18 Windows binary archive linked from the official PostgreSQL download page. Proposed runtime/data under this repository's `.local/postgresql/`, excluded from Git before use. Run on localhost using a dedicated port and separate development/test databases; no Windows service, global PATH modification or Docker requirement. Verify artifact provenance/integrity and executable compatibility before initialization. No existing data is to be deleted or reinitialized.
2. Standard EDB Windows installer linked by PostgreSQL: persistent system installation/service and optional pgAdmin. This changes machine configuration and may require administrator interaction; use a dedicated new data directory and development/test databases.
3. If PostgreSQL already exists elsewhere, use the supplied installation path or local endpoint after checking version, access and isolation. Do not request passwords in chat.

Sources checked: [PostgreSQL Windows downloads](https://www.postgresql.org/download/windows/) and [PostgreSQL license](https://www.postgresql.org/about/licence/). Both proposed PostgreSQL approaches have RM0 software-license/service cost for this local task; existing hardware, disk, electricity and subscriptions are excluded. No paid service or public deployment is proposed. Docker is not recommended as the immediate prerequisite because it was not found and WSL could not be inspected.

## Changes and verification

Only this status document was created during the initial M1 check. No application code, migrations, packages, database installations or protected agent configuration were changed. No milestone acceptance tests ran: a suitable PostgreSQL instance is still required. Previous Phase 0 test results are historical, not a current M1 pass. M1 is incomplete; M2 has not started.

Next action: obtain the installation choice, set up/verify the selected local database, then implement and test M1. Continue to M2 only after M1 acceptance passes; stop after M2 for review.
