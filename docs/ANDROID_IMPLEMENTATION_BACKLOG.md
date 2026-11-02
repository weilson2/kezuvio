# Android implementation backlog and M1 file plan

31 October 2026. Everything below is planned, not executed, except the delivered M0 documents. Milestone numbers refer to the Android specification, not prior website deliveries.

## Ordered backlog and acceptance

| ID / milestone | Deliverable | Dependencies | Acceptance evidence |
| --- | --- | --- | --- |
| M0-01 complete | Audit, plan, guide/scoring, ADRs, model/privacy, backlog | Supplied specification and source inspection | Six Markdown files; explicit facts/assumptions; no source changes |
| V-01 before product build | 15 interviews and clear workflow selection | Founder recruitment | Anonymized incident evidence, costs, alternatives and negative cases |
| V-02 before product commitment | Two concept studies and at least 5 beta commitments | V-01; separate future prototype work | Observed task results, dated explicit commitments and go/revise decision |
| M1-01 | Local version-control baseline and Flutter/Android toolchain | M0 review, next implementation authorization | SDK/JDK versions recorded; doctor and Android device checks; no secrets tracked |
| M1-02 | Android scaffold, Material 3 tokens, en/zh-Hans, route shell, local disclosure, dev/staging/prod separation | M1-01 | Both locales work offline; no account gate; persistent language; distinct flavor data stores |
| M1-03 | Exact-money/date domain rules, repositories, schema v1, seeded categories and migration harness | M1-01; data contract review | Constraint/error tests, schema snapshot, file DB close/reopen, rollback and money/refund/transfer fixtures |
| M1-04 | Basic dashboard and transaction list/create/edit/delete with all four kinds | M1-02/03 | Saved records survive restart; dashboard uses documented formulas; destructive confirm/cancel and dependent-refund guard |
| M1-05 | Mobile CI and foundation QA | M1-04 | Formatting/analyze/test; debug APK; integration tests where supported; dependency/license/secret review; dated actual results |
| M2-01 | Category CRUD/archive, search/filters, reports/date ranges and CSV | M1 accepted | Reference-safe category operations; totals reconcile; bilingual exports; formula-injection cases |
| M2-02 | Camera/file receipt flow with private storage | M1 persistence | Cancellation/denial/disk-full recovery; missing source URI does not lose copied receipt |
| M2-03 | Backup/replace restore and clear-data | M2-01/02 | Data+receipt round trip, schema compatibility, interrupted activation/cleanup, corruption rejection and repeated-restore tests |
| M3-01 | Beta/device/accessibility/security QA | Complete M2; recruited testers | Airplane mode, low storage, process kill, small phone/tablet, font scaling, migrations and recovery; zero unresolved data-loss defects |
| M3-02 | Store materials and release preparation | M3-01; operator/account details | Privacy/Data safety reflect actual behavior; Play rules rechecked; tester guide and staged rollout/rollback plan |
| M3-03 | Signed release AAB / submission | Secure signing supplied and explicit release approval | Recorded package/version, signing validation and real submission status; never presume approval |
| M4-01 | Booking client template design and implementation | Validated client demand and separate scope | Durable transactional conflict prevention, server tenant auth/RLS tests, client-owned data/account and SOW |

Recurring entries, monthly charts beyond core reporting, PIN/biometric lock and CSV import preview remain SHOULD features after MUST acceptance. Bank sync, e-Invoice submission, OCR, payroll, subscriptions, cloud sync, POS and multi-company accounting remain outside v1.

## Milestone 1 proposed file plan

These paths do **not** exist as part of this delivery. Scaffold-generated files are identified so creation is reviewable; generation must not overwrite the website or root npm manifest.

| Planned path | Purpose |
| --- | --- |
| `apps/ledger_lite/pubspec.yaml`, `pubspec.lock` | App manifest, checked versions, reproducible dependency resolution and declared assets |
| `apps/ledger_lite/.gitignore`, `.metadata`, `analysis_options.yaml`, `README.md` | Flutter scaffold metadata, exclusions, lint rules, setup/build/flavor instructions |
| `apps/ledger_lite/android/**` | Generated Android Gradle project/wrapper, Kotlin activity, manifest, icons/resources; review target/min SDK, permissions and flavors |
| `apps/ledger_lite/android/app/src/main/res/xml/backup_rules.xml` | Legacy exclusions for sensitive local data |
| `apps/ledger_lite/android/app/src/main/res/xml/data_extraction_rules.xml` | Modern cloud/transfer exclusions; referenced by manifest |
| `apps/ledger_lite/lib/main.dart` | Bootstrap database, recovery prerequisites and provider scope |
| `apps/ledger_lite/lib/app/app.dart`, `router.dart`, `app_config.dart` | Material app, supported routes, locale and build flavor configuration |
| `apps/ledger_lite/lib/core/theme/brand_tokens.dart`, `app_theme.dart` | Adapt existing brand values and accessible semantic colors |
| `apps/ledger_lite/lib/core/money/money.dart`, `core/time/business_date.dart` | Exact sen parser/formatter, limits and business date policy |
| `apps/ledger_lite/lib/l10n/app_en.arb`, `app_zh.arb`, `l10n.yaml` at app root | Translation keys and generated localization configuration; zh explicitly Simplified Chinese |
| `apps/ledger_lite/assets/brand/**`, `assets/fonts/**` | Necessary copies of existing logos/fonts and licenses; no unnecessary full marketing bundle |
| `apps/ledger_lite/lib/data/database/app_database.dart`, `tables.dart`, `migrations.dart` | Drift tables, foreign keys/checks, transaction and migration setup |
| `apps/ledger_lite/drift_schemas/**`, `lib/data/database/*.g.dart` | Versioned schema snapshot and generated Drift code under a documented generation policy |
| `apps/ledger_lite/lib/features/transactions/domain/ledger_transaction.dart`, `transaction_repository.dart`, `cash_flow.dart` | Immutable entities, repository contract and formulas for all four kinds |
| `apps/ledger_lite/lib/features/transactions/data/drift_transaction_repository.dart` | Persistent CRUD and atomic refund validation; no widgets in data layer |
| `apps/ledger_lite/lib/features/transactions/application/transaction_controller.dart` | Mutation lifecycle, validation/error mapping and refresh |
| `apps/ledger_lite/lib/features/transactions/presentation/transaction_list_screen.dart`, `transaction_form_screen.dart` | Basic list and create/edit/delete, refund direction and internal transfer entry |
| `apps/ledger_lite/lib/features/categories/domain/category.dart`, `data/default_categories.dart` | Stable category identity and localized defaults; full category CRUD waits for M2 |
| `apps/ledger_lite/lib/features/dashboard/presentation/dashboard_screen.dart` | Current-month inflows/outflows/net cash flow and empty/error states |
| `apps/ledger_lite/lib/features/onboarding/presentation/onboarding_screen.dart` | Language choice and honest local-data disclosure |
| `apps/ledger_lite/lib/features/settings/presentation/settings_screen.dart` | Language/about/local-storage explanation; no nonfunctional backup buttons |
| `apps/ledger_lite/test/core/money_test.dart`, `business_date_test.dart` | Parsing, range, negative/zero rejection, precision and calendar/timezone tests |
| `apps/ledger_lite/test/features/cash_flow_test.dart`, `transaction_repository_test.dart` | Cash-flow example, refund linkage/cap, transfer exclusion, edits/deletion and persistence failures |
| `apps/ledger_lite/test/data/database_test.dart`, `migrations_test.dart`, `test/fixtures/**` | Schema constraints, foreign keys, fresh install/reopen and future upgrade fixture harness |
| `apps/ledger_lite/test/widgets/onboarding_test.dart`, `transaction_form_test.dart`, `dashboard_test.dart` | English/Chinese validation, state rendering, 360px logical width, large text and confirmations |
| `apps/ledger_lite/integration_test/ledger_flow_test.dart` | Persistent add/edit/delete, restart/reopen and offline basic flow on Android |
| `.github/workflows/ledger-ci.yml` | Isolated mobile verification; existing web CI preserved |
| `.gitignore` (minimal additive edit) | Flutter build/cache/local settings and signing-key exclusions; no ignore of app lockfile/schema snapshots |
| `docs/ANDROID_DEPENDENCIES.md`, `docs/ANDROID_MILESTONE_1_VERIFICATION.md` | Chosen versions/licenses, actual commands/results/screenshots and known gaps |

Generated localization output should use the supported Flutter generator location at the selected SDK version; do not hand-edit generated translations or Drift code. Commit schema snapshots. Decide and document whether generated Dart output is committed or recreated in CI, then enforce one consistent policy. No backend `.env.example` is needed for offline M1; preserve the existing website `.env.example`.

## M1 acceptance checklist

- Android app launches in dev flavor and works in airplane mode without sign-in; distinguish no-network app behavior from system file providers (M2).
- English and Simplified Chinese onboarding, navigation, forms and summaries fit 360 logical pixels and large text; theme colors are accessible. Verify dark theme only if shipped.
- Persist valid income/expense/refund/internal-transfer entries across process restart. Empty, loading, validation, failure and destructive-confirmation states are usable.
- Totals match the data contract; reject invalid dates, fractional/negative/zero money and invalid linked refunds. Database and repository constraints prevent partial changes.
- Seeded categories work and preserve references. Full category management, receipts, reports/export, backup/restore and clear-data remain visibly outside M1; do not present it as the complete MVP.
- Create/reopen schema v1 and preserve fixture data. With only v1 there is no genuine historical upgrade to claim tested; establish snapshots/harness and add v1→v2 migration tests when the first real migration exists. Never invent an upgrade test result.
- Run `dart format --output=none --set-exit-if-changed .`, `flutter analyze`, `flutter test`, Android integration tests where available, and `flutter build apk --debug --flavor dev`. Execute from the app directory after dependency/code generation. Report failures and unavailable-device checks separately.
- Inspect app permissions, OS backup configuration, dependencies/licenses and source for secrets. No production signing keys or analytics payloads.
- Report changed files, exact commands, actual results, English/Chinese screenshots at 360px logical width, and known limitations. Stop after M1 review; do not automatically begin M2.

## M2/M3 test priorities and release boundaries

Before merchant beta, prioritize data durability over extra UI: backups with receipts, safe restore of old schemas, corrupt archives, disk-full/permission errors, journal recovery, cascading cleanup and category references. Every shipped upgrade needs a preservation test from every supported source schema. Check CSV Unicode, quoting and formula protection against real target spreadsheet apps.

Use an older supported physical Android phone and a current API device/emulator, plus tablet layouts, rotation, screen reader, large fonts, low storage and process death. A desktop widget test is not evidence of physical camera/storage behavior. Record device/API/version and actual result. Establish a testable maximum dataset using merchant volumes before beta rather than fabricating performance claims.

M3 supplies store description drafts, screenshot plan, privacy/operator details, Data safety review, content rating/target audience answers, account-specific tester instructions, support plan and staged rollout criteria. Release requires no open data-loss/security blockers, successful restore drill and a rollback plan. Rollback may require a forward fix if an older binary cannot read a newer schema; never silently downgrade a database. Hosting, store registration, purchase, signing credentials and publishing remain outside this M0 task.

## Decisions before M1 begins

Review the provisional product selection and interview evidence; confirm single-device/MYR/language assumptions and money semantics; establish SDK/device readiness; select supported Android floor and package identity. User authorization to proceed with M1 is still required because the current request explicitly ends at this report. No implementation has begun.
