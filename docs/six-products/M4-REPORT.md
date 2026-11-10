# M4 — AI Automation Hub

11 November 2026, Asia/Kuala_Lumpur. The user completed manual acceptance and approved M4 closure. See [closure verification and database recovery rehearsal](PROGRESS.md#m4-acceptance-and-database-recovery-rehearsal). The delivery record follows.

## Review workflow

Open `http://127.0.0.1:3000/demo/automation-hub` or choose **Try AI Automation Hub** on the demo portal. The shared Labs role selector switches between Customer, Manager and Viewer in the same demo workspace.

1. As **Customer**, submit a fictional inquiry. Use `juniper@example.test` and a brief such as “We need a website with an appointment booking workflow and a reporting dashboard.” The inquiry appears in your workspace and queues an analysis task.
2. As **Manager**, open the workflow and start the analysis task. Finish the run to save the requirements and draft quote. The analysis shows which keywords matched and the rule version. Try a simulated failure, then explicitly retry and complete the next attempt.
3. Review the draft quotation, edit its line items or discount, and save. Record a human review note and approve the quotation. Queue the approved revision for readiness, then start and finish the readiness task. The quotation becomes **Ready** and remains a local demonstration.
4. Edit an approved or ready quotation to return it to Draft. A readiness task for the earlier revision cannot mark the edited quote ready. Use the review controls to reject or approve the current revision.
5. Configure the sample rates before running another inquiry. Existing quotes retain their saved lines and pricing version. Schedule a fictional follow-up, inspect its due or overdue status, then record manual completion.
6. Switch to **Viewer** for summary counts or return to Customer for your own inquiry and quotation status. Use **Reset demo** to clear this Automation workspace. Another browser context retains its own data.

Start the existing local PostgreSQL cluster if needed using the [Cafe setup guide](M1-M2-REPORT.md). From the repository run `npm.cmd run db:migrate`, `npm.cmd run build` and `npm.cmd run start` when rebuilding the local preview. The ordinary preview uses the development runtime role. Browser acceptance uses a separate test database on localhost port 3100.

The review preview is running on `127.0.0.1:3000`. The local logs are `tmp/automation-review.stdout.log` and `tmp/automation-review.stderr.log`.

## Implementation

The Hub reuses Labs sessions, role selection, expiry, polling, CSRF and origin checks, request bounds, persisted idempotency, audit events and generation reset. The new product route uses the existing brand and UI primitives. The sixth additive migration creates `automation.documents` with a fixed product identity, composite workspace/generation key, forced row-level security and checks for quotation arithmetic and current approval on Approved or Ready records.

The inquiry form requires a fictional `.test` address and bounded brief, budget and timeline. Analysis runs in-process through versioned rules that map fixed keywords to suggested requirements. Identical brief input and rule version produce the same suggestions. The inquiry text remains inert data. The rules provide a discovery fallback when no specialist keyword matches.

Pricing uses integer sen. The six configurable rates generate line prices when analysis completes. A quote keeps the pricing version and saved line items. Edits can change labels, quantities, unit prices and a whole-quote discount up to 30%. Discounts round half a sen upward. A revision guard prevents stale edits and reviews. An explicit Manager approval records a note, timestamp and revision. Preparing readiness checks that approval again at completion. An edit or rejection invalidates the prior approval. The application has no sending action, provider client, paid AI dependency or network call for analysis.

The queue persists each claim, outcome and attempt in PostgreSQL. A Manager explicitly starts and finishes a task. A running attempt has a unique token and a 60-second lease. A failed run may be requeued up to three total attempts. An expired run requires explicit recovery before retry. The repository lock and durable request key prevent duplicate effects. Task completion, quote changes and history commit in one transaction. Reset invalidates requests from the previous generation. Automation history captures human review, pricing changes, queue activity and follow-up events. The platform audit separately records accepted actions with the product, workspace, generation and role.

Customer responses contain their own inquiries, analysis, quotations and task status with internal review notes and attempt tokens removed. Managers operate on records within their workspace. Viewers receive aggregate counts. Roles are simulated inside a visitor session. Follow-ups are stored reminders with a due date, overdue status and manual completion note. They do not schedule messages.

## Verification

| Check | Result |
| --- | --- |
| M3 closure | Commit `24e7a53`, tag `labs-m3-accepted-2026-11-09`. Fresh build, 32 Commerce domain/database and 10 browser tests passed. |
| Pre-M4 backup | Development and test archives, including Commerce, were restored and checked against source snapshots. See [progress and manifest location](PROGRESS.md). |
| `npm.cmd run db:migrate` and `npm.cmd run db:migrate:test` | Sixth migration applied to both local databases. Test migration initially hit a SQL parsing error. The failed attempt left no Automation schema. After correcting the expression, the failed migration record was marked rolled back and deploy passed. |
| `node --test tests/labs/automation-domain.test.mjs` | 19 passed. |
| `node --test tests/labs/automation-db.test.mjs` | 8 passed, including concurrency, RLS, quote integrity and cross-product reset. |
| `npm.cmd run test:platform`, `test:cafe`, `test:commerce` | 27, 30 and 32 passed respectively. |
| Automation PostgreSQL restart | Prepared a Running task, gracefully stopped and restarted PostgreSQL, completed the same persisted attempt and replayed completion. One analysis and draft were recorded. |
| Ledger Lite `flutter test --no-pub` | 32 passed using the installed SDK and local cache. |
| `npm.cmd run build`, `npm.cmd run typecheck`, `node scripts/check-brand.mjs` | Passed. The lockfile adds only the local Automation workspace. |
| `npm.cmd test` with `CI=1` | 8 legacy domain and 51 website/legacy browser tests passed on the fresh production build. |
| `npm.cmd run test:labs` | 37 passed in 1.9 minutes. Includes 12 Automation, 11 Cafe, 10 Commerce and 4 platform journeys. |
| Ordinary local preview smoke check | Automation, Cafe and Commerce pages and sessions return 200. Legacy shop returns 200, retired QR link returns 308 and acceptance fixtures return 404. |
| Git verification | `git diff --check` passed. The M3 tag resolves to its closure commit. Unrelated file hashes match the pre-M4 snapshot and the index is empty. |

**244 distinct tests passed.** The Automation browser suite exercised inquiry submission, simulated failure and retry, quote editing and readiness, configurable pricing, follow-ups, lost-response recovery, reset and isolation. Accessibility and overflow checks covered populated views at 375, 768 and 1440 pixels in light and dark themes.

Review screenshots were visually inspected. [Desktop overview](../previews/automation-m4/desktop-overview.png) · [Mobile quotation in dark mode](../previews/automation-m4/mobile-quotation-dark.png)

## Limits and operating scope

Workspace bounds include 25 inquiries, 100 tasks, 100 follow-ups, 500 history entries, 12 lines per quote, and the platform's 256 KB state, action and session limits. Sessions expire after one hour. The queue is an operator-triggered simulation with no continuous worker. Its rates and dates are illustrative. Incremental paid service cost is RM0. Local backup verification is a same-cluster restore rehearsal. Hosted CI, Android device testing and external disaster recovery are outside the executed checks.
