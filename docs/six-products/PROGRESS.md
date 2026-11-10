# Programme progress

Updated 11 November 2026, Asia/Kuala_Lumpur.

- M1 shared platform and M2 Cafe POS: automated and manual acceptance approved by the user. Milestone closure includes the separately requested QR consolidation and shared demo layout, which are dependencies of the accepted Cafe UI.
- M3 Commerce Studio: accepted and closed at `24e7a53` with tag `labs-m3-accepted-2026-11-09`. See [delivery and acceptance evidence](M3-REPORT.md).
- M4 AI Automation Hub: manual acceptance completed. Closure is recorded by the annotated tag `labs-m4-accepted-2026-11-11`. See [implementation and verification](M4-REPORT.md).
- M5 Property CRM: planning approved. Implementation awaits a separate decision.

Unrelated Ledger Lite files, its preview/scripts, website scroll change, navigation-scroll tests and Flutter ignore patterns remain outside the M1/M2 commit.

Fresh closure verification: `npm run build`, `npm run typecheck`, `node scripts/check-brand.mjs`, `npm run test:unit` (8), `npm run test:platform` (27), `npm run test:cafe` (30), and `npm test` (8 domain + 51 browser/API) passed. Labs acceptance is recorded below after completion. The legacy browser run also exercised the preserved, uncommitted navigation-scroll tests.

During resume, PostgreSQL had stopped; the first Labs rerun produced database-unavailable failures and was cancelled. The existing local cluster was started without reinitializing it, then the suite was rerun. The sandbox could not access the protected cluster; authorized elevated tool execution was used. No credentials were printed.

Closure Labs rerun: `npm run test:labs` — 15/15 passed (53.3s) against the fresh production build. M1/M2 are accepted and ready for the closure commit and milestone tag.

## Closure and backup

M1/M2 committed as `0727252`, annotated tag `labs-m1-m2-accepted-2026-11-09`. The first commit attempt found no configured identity; the successful command used the same per-command `Codex <codex@localhost>` identity as the existing baseline, without changing global Git settings. Exact file paths were staged; only `/.local/` was staged from the mixed `.gitignore` changes.

`node scripts/labs-backup.mjs` passed for both development and test databases. Verified manifest: `.local/postgresql/backups/2026-11-09T04-38-43-715Z-50d1462f/manifest.json`. Each custom-format archive has a SHA-256 digest and was restored into a unique temporary database. Every table's row-content digest, schema, effective table permissions, RLS policies, migrations and sequence safety matched; scratch databases were removed. The private directory grants access only to the local user and SYSTEM. Source databases were not modified and credentials were not printed or committed.

Backup corrections before success: Windows PowerShell could not load its ACL cmdlet module, so the helper uses .NET ACL methods; forced-RLS tables require the migration owner's explicit full-row policy during dump; restored databases preserve their source owner; null/default table ACLs are compared by effective permissions. Failed attempts have no verified manifest and are retained privately. This is a same-cluster logical restore rehearsal, not off-device disaster recovery. Equivalent roles must be provisioned separately on another cluster; role passwords are not in archives.

M3 completed with Sam owning domain rules/unit tests, Mia UI, Ada browser tests/review, and Alex integrating database/API changes and regressions. All 205 distinct regression tests passed: 8 legacy domain, 27 platform, 30 Cafe, 32 Commerce domain/database, 25 Labs browser/API, 51 legacy browser/API and 32 Ledger Lite. Build, typecheck, brand, additive migrations, pre-M3 backup restore and an actual Commerce PostgreSQL restart rehearsal passed. The initial accessibility/output-directory failures and their fixes are recorded in the M3 report.

The website scroll change, navigation-scroll test and Ledger script match their initial hashes; unrelated Flutter files/ignore patterns remain unstaged. M3 manual acceptance now authorizes its closure and M4 only. Public deployment, purchases, real messages and paid AI APIs remain excluded.

## M3 closure / M4 authorization

9 November: reviewed Git changes and independently audited the explicit M3 staging scope. Excluded `.gitignore` Flutter patterns, the website scroll modification, Ledger Lite application/previews/script and navigation-scroll test. Closure rerun: 32 Commerce domain/PostgreSQL tests, typecheck and brand passed. Fresh-build browser verification is recorded when complete.

`node scripts/labs-backup.mjs` passed again for both local databases, now including Commerce. Private manifest: `.local/postgresql/backups/2026-11-09T14-22-54-700Z-a8a6d3b7/manifest.json`. Both archives restored into unique scratch databases; table contents, schema/effective permissions/RLS and sequence safety matched. Scratch databases were removed, source databases unchanged, no credentials exposed. The same-cluster/off-device limitation still applies.

M3 closure fresh build passed; `npm.cmd run test:labs -- tests/labs/commerce.spec.ts` passed 10/10 in 39.7s. M3 is accepted for the closure commit and tag.

M3 closure committed as `24e7a53`, annotated tag `labs-m3-accepted-2026-11-09`. Only the audited M3 paths were staged; all unrelated work remains unstaged. M4 implementation started after this gate. Sam owns the domain and unit tests, Mia the new UI, Ada browser tests/review, and Alex the database/API integration and final verification. No paid APIs, messages, public deployment or M5 work.

## M4 review handoff

11 November. The delivery run passed 244 distinct tests across Automation, Cafe, Commerce, platform, website, legacy demos and Ledger Lite. The running-task restart rehearsal and ordinary preview smoke checks also passed. The migration syntax failure and recovery are recorded in the M4 report.

## M4 acceptance and database recovery rehearsal

The user completed manual acceptance and authorized M4 closure. A fresh closure run passed `npm.cmd run test:automation` (27), `npm.cmd run test:unit` (8), `npm.cmd run build`, `npm.cmd run typecheck`, `node scripts/check-brand.mjs` and `npm.cmd run test:labs -- tests/labs/automation.spec.ts` (12, 36.6 seconds). Full cross-product regression counts above are from delivery. The closure run was targeted to M4 and the shared baseline.

`npm.cmd run db:backup` produced verified M4-era development and test archives, including `automation.documents`. Manifest: `.local/postgresql/backups/2026-11-10T20-06-34-107Z-ecb18c5d/manifest.json`. Separately, an ignored one-off rehearsal reused the existing backup helper's connection guards and verification functions to restore both original pre-M4 archives from `2026-11-09T14-22-54-700Z-a8a6d3b7`. Archive SHA-256, restored table contents, schema fingerprints and sequence safety matched. The pre-M4 restores retained Cafe and Commerce and had no Automation schema. Every restore used a generated scratch database, which was removed after verification. The active databases and local credentials stayed in place.

The rollback path is to use a prior compatible application revision for an app-only rollback and keep additive schemas in place. If restoring data is necessary, first back up current state, restore the selected verified archive to a separate database with the original role mapping, and validate the matching application before any separately authorized connection switch. A switch to a pre-M4 snapshot would omit writes made after that snapshot. This rehearsal verified the database restore path. Application cutover and off-device recovery were outside the rehearsal.

Closure staging included only M4 implementation, migration, tooling, tests, previews and acceptance documentation. The independent Ledger Lite work, its preview and script, the website scroll change, navigation-scroll test and Flutter ignore rules stayed outside the commit.
