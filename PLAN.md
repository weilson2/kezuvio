# Kezuvio Android product — Milestone 0

Prepared 31 October 2026. Status: planning complete; product demand unvalidated; implementation not started.

Authority: `KEZUVIO_APP_BUSINESS_PLAN_AND_CODEX.md` (version 2026-10-30) and the current request to execute **Milestone 0 only**. The attachment's broader build instructions do not authorize Milestone 1 here. Existing website milestone reports describe a separate project.

## Recommendation and assumptions

Validate **Ledger Lite**, an Android, single-device cash-flow record for Malaysian microbusinesses. Keep custom client projects as a separate revenue line, with Booking as a later client template. Ledger Lite is a provisional selection, not a validated opportunity.

Assume one business per installation, MYR only, English and Simplified Chinese, no mandatory account, no backend, no subscription, and no automatic telemetry in v1. Confirm merchant workflow, language needs, supported devices and willingness to manage backups through interviews. Mandarin/English alone may not cover the target market; measure Bahasa Malaysia demand before choosing the initial segment.

## Milestone 0 deliverables

| Artifact | Contents |
| --- | --- |
| [Repository audit](docs/ANDROID_REPOSITORY_AUDIT.md) | Existing modules, reuse limits, toolchain, actual checks and setup prerequisites |
| [Opportunity validation](docs/OPPORTUNITY_VALIDATION.md) | Interview guide, provisional scoring, competitor evidence, prototype study, beta and commercial gates |
| [Architecture decisions](docs/ANDROID_ARCHITECTURE_ADR.md) | Proposed ADRs, application boundaries, dependencies, CI and delivery approach |
| [Data and privacy design](docs/LEDGER_DATA_AND_PRIVACY.md) | Entities, cash-flow formulas, time policy, backup/restore, retention and data map |
| [Implementation backlog](docs/ANDROID_IMPLEMENTATION_BACKLOG.md) | Dependencies, milestone acceptance criteria and exact Milestone 1 file plan |

## Repository findings and architecture

This is an existing Next.js/React/TypeScript website with six fictional demos, reusable brand assets, tests and web CI. It has no Flutter project, persistent ledger database or Git metadata. Preserve `apps/website`, `packages/brand`, `packages/ui`, marketing assets and historical reports.

Proposed mobile boundary: `apps/ledger_lite/`, independently built with Flutter/Dart and Material 3. UI uses Riverpod and GoRouter; domain logic owns exact money, dates and reports; repository interfaces isolate Drift/SQLite and app-private receipt files. Reuse the brand palette and vector artwork, adapting typography to Flutter. Do not port the demo server, selectable roles or demo P&L rules into a production product. Keep shared Dart packages deferred until a second real consumer exists.

The data model comprises transactions, categories, attachments and versioned backup metadata. Amounts are positive integer sen with direction derived from transaction type and refund direction; transfers within the business are excluded from income/expense totals. Reports describe cash movement, never tax-compliant or accrual profit. See the data design for constraints and examples.

## Product validation and milestone gates

1. Conduct at least 15 merchant interviews; record recent behavior, existing alternatives, costs and refusals. Obtain at least five genuine beta commitments and identify one clear, recurring top problem before committing to the product build. No interviews, contacts or commitments were generated in this task.
2. Test two clickable concepts (Ledger Lite and Booking) after interviews. This milestone supplies their study plans; prototypes and field research remain future work.
3. Review this plan and the evidence before Milestone 1. Then establish the mobile toolchain and implement only the foundation, local schema, bilingual navigation, dashboard and transaction CRUD.
4. Milestone 2 completes categories, reports, CSV, receipts, backup/restore and clear-data flows. Do not place real merchant records in an M1 build without recoverable backup/export.
5. Milestone 3 covers device QA, security, beta and release preparation. Milestone 4 is a separately validated Booking client template. The existing booking website demo does not satisfy its production requirements.

The specification's five beta candidates are a product gate, not the Play closed-test cohort. Official guidance currently requires 12 continuously opted-in testers for 14 days for qualifying new personal accounts; recheck account applicability at release. [Google Play testing](https://support.google.com/googleplay/android-developer/answer/14151465).

## Privacy and operational boundaries

Ledger records and receipts stay in app-private storage by design; exports go only to a user-selected destination, which might be a cloud document provider. No silent uploads, accounts, ads or receipt contents in logs. Disable and test OS backup/transfer of sensitive app data; a generic “offline” label alone does not establish this. Deletion must cover local files, database and temporary recovery copies, while explaining that previously exported files remain under the user's control. Full policy wording depends on the implementation and operator details.

Client work requires a written scope, acceptance criteria, payment milestones, data/IP ownership and client-owned production accounts. Cloud-heavy work requires the interview/beta gate and ideally two paying pilot commitments. Restaurant POS integration requires at least one validated paying pilot. No production account, payment or publishing action is included here.

## Budget and risks

Retain the source's **RM700–3,000 first-90-day planning envelope**, excluding labor, existing subscriptions and additional hardware; it is not a verified quote or spending approval. The offline prototype needs no backend hosting allocation. Track committed and actual spend separately; this task made no purchase. Validate any store, domain, device or provider price before spending.

| Risk | Response / evidence needed |
| --- | --- |
| Generic expense tracker has little differentiation | Observe repeated merchant pain and compare alternatives before feature investment |
| Users need shared devices/cloud or e-Invoice first | Treat as a failed fit for this scope; reassess rather than expand silently |
| Lost phone, corrupted database or interrupted restore | Manual backup, staged restore, migrations and recovery tests before beta |
| Refunds/transfers produce misleading totals | Explicit semantics, fixed examples and exact integer tests in M1 |
| Flutter/Android tooling unavailable | Install and verify the documented toolchain in a later authorized implementation step |
| No version-control history | Establish a local baseline before coding; do not treat old reports as Git history |
| Privacy or Play claims exceed evidence | Verify actual SDK/data behavior and current policy before release |

## Acceptance and stop report

Milestone 0 is complete when the audit, interview guide, scored opportunities, ADRs, data/privacy plan and implementation backlog exist and distinguish facts from hypotheses. Documentation must identify the M1 files without creating them, preserve working modules and report actual checks.

Current checks: **9/9 existing demo domain tests pass**; existing brand validation passes. No Flutter tests/builds ran because the app and usable toolchain are absent. No new UI exists, so there are no new screenshots. Prior website browser results are historical and were not rerun. All changes in this milestone are planning documents. **Stop here; Milestone 1 remains unstarted.**
