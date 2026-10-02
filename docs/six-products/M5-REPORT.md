# M5 — Property CRM

Subsequent continuation update: user authorized work through M12. M6 is now REVIEW with [fresh evidence](../roadmap/M6-REPORT.md); compatible Next/Effect patches resolve the advisory matches recorded in the earlier M5 handoff. See the [execution log](../roadmap/EXECUTION_LOG.md) for current results. Historical acceptance-stop wording below is superseded; M5 itself remains unaccepted.

Current update, 23 November 2026: **REVIEW**, awaiting founder acceptance. The [current handoff](../roadmap/M5-REVIEW-2026-11-23.md) records the missing archive/restore flow correction, active-only workload, activity subjects and editor focus, **288 freshly passing regression tests**, backup/restore/restart/API fixture evidence, current preview and unresolved dependency advisories. The [master backlog](../roadmap/MASTER_BACKLOG.md) governs M5–M12. The 11 November report below is historical; no M5 acceptance commit/tag exists.

11 November 2026, Asia/Kuala_Lumpur. M5 is implemented and verified. The local preview and working tree are ready for manual acceptance. See the [approved scope](M5-PLAN.md).

## Manual acceptance

Open [Property CRM](http://127.0.0.1:3000/demo/property-crm) or choose **Try Property CRM** on the demo portal.

1. Start as **Customer**. Search the available fictional Malaysian listings by area or title, and filter by type and asking price. Prices appear in RM. Switch to **Manager** for internal records and controls.
2. Create an available listing and a sample contact using an address such as `customer@property.example.test`. Create a lead, link it to the listing and assign an active agent. Try qualifying a second lead without a listing or agent and confirm the server rejects the move.
3. In the pipeline, use the keyboard to move the assigned lead from New to Qualified. Use the same controls to try Viewing before recording a viewing. Schedule a future viewing in Malaysia time, then move to Viewing.
4. Try booking an overlapping slot on a second lead with the same agent, then with the same property and a different agent. Try an adjacent slot. Create another appointment and attempt a conflicting reschedule. Refresh and confirm its original slot remains. Cancel the blocking booking and retry.
5. Schedule an internal follow-up, inspect its due status, and record completion or cancellation. Test closing a lead while it still has a scheduled viewing or pending reminder. Resolve both before closing.
6. Use the seeded **Hafiz Rahman** lead in Viewing to exercise the completed-viewing path. Move it to Offer, then Won. Test Lost on an open lead with a reason. Review audit history, won/lost counts, conversion, and distinct listing asking value.
7. Reload and confirm saved changes. Switch to **Viewer** for aggregate analytics. Open a separate browser profile and confirm it has its own workspace. Reset Property CRM in the first profile and check that the second workspace and other Labs demos retain their data.

The local cluster must be running before starting a preview. See the [local PostgreSQL setup](M1-M2-REPORT.md). From the repository, run `npm.cmd run db:migrate` and `npm.cmd run build` to prepare a new build, then `npm.cmd run start` on port 3000. The isolated browser test preview uses port 3100 and the test database.

The corrected review build is running on localhost port 3000. Its logs are in `tmp/property-review.stdout.log` and `tmp/property-review.stderr.log`.

## Permitted transitions

| From | Permitted targets | Server requirements |
| --- | --- | --- |
| New | Qualified, Lost | Qualified requires an available listing, an active assigned agent and an active contact. |
| Qualified | Viewing, Lost | Viewing requires a scheduled or completed viewing for the lead's current listing and agent, plus the active associations. |
| Viewing | Offer, Lost | Offer requires a completed viewing for the current listing and agent, plus the active associations. |
| Offer | Won, Lost | Won retains the completed viewing and active association requirements and requires all scheduled viewings and pending reminders to be resolved. |
| Won or Lost | None | Terminal. A closed lead can be archived while its historical records remain linked. |

Lost always requires a reason and resolution of scheduled viewings and pending reminders. It can close a lead even if the lead never acquired a listing or agent. No same-stage, skipped, backward or reopen transition is allowed. The current record version is required. Changing the listing or agent is blocked while a viewing is scheduled. A completed viewing tied to prior associations cannot qualify the lead for Offer or Won after reassignment. Won does not change listing availability automatically.

## Implementation and safeguards

- Catalogue and CRM records cover eight fictional Malaysian listings, a three-agent roster, separate contacts and leads, listing/contact editing and archive controls, lead assignment, a keyboard-operable stage board, viewing schedules, reminder status, analytics and manager activity.
- The shared session resolves product, workspace, role and generation before the module sees action intent. Manager mutations are validated on the server. Customer sees available catalogue listings, and Viewer sees aggregate counts. Agent selection is a CRM association. Demo roles are selectable simulations.
- The seventh and eighth migrations add `property.documents` and its corrected constraint, with fixed product identity, a workspace/product foreign key, forced row-level security, schema checks and an overlap invariant. The workspace transaction locks before reducing any action. Slots use UTC instants, last 15–120 whole minutes, and start within the next 365 days. Overlap uses half-open intervals. A scheduled overlap on either resource is rejected. Back-to-back slots are valid. A rejected reschedule leaves the saved slot and history intact. Cancellation changes status and releases its interval without deleting the appointment. Completion is available once the slot has ended.
- The shared request key prevents duplicate effects and audit records. Reset increments the product workspace generation and reseeds only that workspace. Platform audit records accepted actions, and the Property activity panel shows recent changes. The domain projects overdue status from the server clock and displays timestamps in `Asia/Kuala_Lumpur`.
- Asking prices use integer sen. Closed-lead conversion uses current non-archived Won and Lost leads, with a blank rate when none are closed. The asking value counts each distinct available listing linked to open leads once. This is asking value in the active pipeline.

## Verification

The [progress record](PROGRESS.md#m5-authorization-and-backup) records the pre-migration backup. Both local databases were restored into scratch databases and verified before the seventh migration was applied. Each archive retains the existing role and schema fingerprints and is stored in a private Git-ignored directory.

| Command or check | Actual result |
| --- | --- |
| `npm.cmd run db:migrate:test`, `npm.cmd run db:migrate` | Both Property migrations applied locally. |
| `npm.cmd run test:property` | 26 passed, comprising 17 domain and 9 PostgreSQL integration cases. |
| `npm.cmd run test:platform`, `test:cafe`, `test:commerce`, `test:automation` | 27, 30, 32 and 27 passed respectively. |
| `npm.cmd run build` and `npm.cmd run typecheck` | Passed. The local-only lockfile update adds the Property workspace. |
| `npm.cmd test` with `CI=1` | Brand, 8 legacy domain and 51 website and legacy browser/API tests passed. |
| `flutter test --no-pub` | 32 Ledger Lite tests passed using the existing SDK and cache. |
| `node scripts/labs-property-restart.mjs prepare`, graceful PostgreSQL restart, then `verify` | A scheduled viewing, session, audit history and durable request key survived restart. Replaying the request did not book a second viewing. |
| Ordinary preview smoke checks | Website, branding, demo portal, all Labs pages and sessions, and the legacy shop returned 200. The retired QR URL returned 308 and acceptance-only routes returned 404. The Property Customer packet contained seven available listings and no leads. |
| `npm.cmd run test:labs -- tests/labs/property.spec.ts --grep 'keyboard reset'` | 1 passed on the corrected fresh build. |
| `npm.cmd run test:labs` | 50 passed in 2.4 minutes on the corrected build. Includes 13 Property, 12 Automation, 11 Cafe, 10 Commerce and 4 platform journeys. |

The first Property integration run rejected workspace creation because the initial SQL check used an ambiguous `value` column in its overlap join. Migration `202611110002_property_constraint` aliases both set-returning columns and aligns the database collection and price bounds with the domain. The integration rerun passed without rewriting existing migrations or replacing databases. A partial Labs run was stopped for a rebuild after the explicit active-contact check was added.

The next Labs run passed 49 of 50 cases. The keyboard test found that confirming reset could lose focus when the trigger was still disabled during the action's completion. The shared shell now restores focus after React enables the trigger. The targeted reset check passed.

**283 distinct tests passed.** The Property browser suite included keyboard stage changes and reset, lost-response recovery, independent booking races for agent and property, cross-product reset, and populated-view axe and overflow checks at 375, 768 and 1440 px in both themes. The [desktop overview](../previews/property-m5/desktop-overview.png) and [mobile dark pipeline](../previews/property-m5/mobile-pipeline-dark.png) were visually inspected. Git diff checks passed and the pre-existing scroll, navigation-test, Ledger script and ignore-file hashes matched. M5 changes remain unstaged for review.

## Limits

Property CRM is a local fictional demo with one-hour visitor sessions, bounded workspace size and action counts, and the existing simulated roles. The three-agent roster is seeded. Follow-ups are internal reminders, and viewings are stored within a workspace. The pipeline uses the keyboard move control across desktop and compact layouts. There is no external calendar sync, live listing feed, customer authentication, paid integration or public deployment. Incremental paid-service cost is RM0.
