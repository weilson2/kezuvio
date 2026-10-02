# M5 Property CRM development plan

11 November 2026, Asia/Kuala_Lumpur. **Approved for local M5 implementation.** M4 is closed at `1bc788e`, tagged `labs-m4-accepted-2026-11-11`. See [programme progress](PROGRESS.md) for acceptance and recovery evidence.

## Proposed outcome

Add a fictional property sales workspace at `/demo/property-crm`. The acceptance journey starts with a listing and a customer inquiry, proceeds through agent assignment, a viewing and a follow-up, and ends with a recorded outcome and reconciled analytics. Each browser workspace has independent records and a reset. Use the existing demo portal, branding and role selector.

| Slice | Proposed features and boundaries |
| --- | --- |
| Listings | Search by title and fictional area. Filter by type, asking price and availability. Manager creates and edits listings, changes availability and archives records. Show asking price in RM, fictional location, attributes and linked lead count. Use existing design assets and fictional descriptions. |
| Contacts and leads | Maintain distinct contact and lead records so one fictional contact can inquire about multiple properties. Manager creates and edits contacts and leads, searches by name and filters by listing, source, stage and assigned agent. A lead may start without a listing. Preserve associations and history when records are archived. Use `.test` email addresses where supplied. |
| Pipeline | New → Qualified → Viewing → Offer → Won. Manager may move any open stage to Lost with a reason. A stage change requires the current record version. Qualified requires a listing and assigned agent. Viewing requires a recorded viewing. Won and Lost are terminal for this increment. The board provides a keyboard-accessible **Move to stage** control on every eligible card. Use a compact stage list on narrow screens. |
| Agent assignment | Seed a fictional roster. Manager assigns or reassigns leads to active agents, with an audit entry. Agent records represent people on the demo schedule. Workspace capabilities come from the server-side demo role. |
| Viewing appointments | Manager schedules, reschedules, cancels and records completion of a viewing against an open lead, its active listing and assigned agent. Show upcoming appointments in a date-grouped list with filters and an accessible date/time form. |
| Follow-up reminders | Manager sets an internal due time and reason, then completes or cancels the reminder. Show upcoming, overdue and completed states, plus a next-action summary on the lead. Status is derived from server time. Reminders are in-app records with no external delivery. |
| Analytics | Show open leads by stage, agent workload, upcoming viewings, overdue reminders, won and lost totals, closed-lead conversion and the asking value of distinct listings linked to open leads. Label the value as asking prices in the active pipeline. |

Use fictional seed data across the journey: approximately 8 listings, 3 agents, 8 contacts, 10 leads, 4 appointments and 4 reminders. Relative appointment and reminder dates use a reference clock so a fresh demo shows useful upcoming and overdue states. Fixed clocks make automated checks reproducible.

## Domain rules and permissions

- **Manager** can manage listings, contacts, leads, assignments, stages, viewings and reminders and inspect audit history. **Customer** sees the available listing catalogue without internal CRM data. **Viewer** sees read-only aggregate analytics. Preserve the shared initial Customer role. These are simulated capabilities within a visitor workspace. A selected lead or submitted agent ID never grants permissions.
- Use archive states to retain links. A listing cannot be archived while it has open leads or scheduled viewings. A contact cannot be archived while it has open leads. An agent must have no open assignments or scheduled viewings before deactivation. Lead archive is available after Won or Lost. Resolve scheduled viewings and outstanding reminders before terminal transition or archive. A lead with a scheduled viewing must cancel it before changing its agent or listing.
- Store timestamps as UTC instants and render them in `Asia/Kuala_Lumpur`. Validate calendar dates and duration, reject new viewing starts in the past, and use half-open intervals `[start, end)`. A viewing conflicts if an overlapping scheduled slot shares its agent or listing. Adjacent slots are allowed. Rescheduling excludes the appointment itself. A rejected reschedule preserves the original slot.
- Use integer sen for asking prices. Closed-lead conversion is `Won / (Won + Lost)` among current, non-archived closed leads, displayed to one decimal place. Show an em dash when no lead is closed. Count leads once in stage and agent totals. Sum each linked active listing's asking price once across open leads. A saved fixture with one Won, one Lost and three open leads on two distinct listings priced at RM450,000 and RM600,000 must show 50.0% conversion and RM1,050,000 asking value.
- Each mutation checks permissions, current generation, record references and expected version where relevant. Store accepted transitions, assignment changes, cancellations and follow-up completions with a timestamp and bounded audit history. Browser retries share request identity, so repeated delivery does not duplicate records or events.

## Architecture and database isolation

Reuse the Next.js App Router, `packages/ui`, `packages/brand`, the Labs shell and existing session/action handlers. Put rules and summary calculations in a new `packages/property` product module after approval. Use `property-crm` as the proposed fixed server-side product ID. The UI sends action intent and record IDs. The repository resolves the visitor, workspace, role and generation.

Follow the Cafe, Commerce and Automation repository pattern with one bounded workspace document in a new `property` schema. Model listings, contacts, leads, agents, appointments, reminders and activity as separate collections in the document. Use an additive migration with a fixed product constraint, composite workspace/product foreign key, a workspace/product/generation key, forced row-level security, and database checks for document bounds and core field shapes. Domain validation within the workspace transaction enforces cross-record references and scheduling rules. Use the current PostgreSQL runtime role and separate migration role. Grant only the schema and table access required for this product.

Use the existing transaction-local RLS context and workspace lock. Scope reads, writes, projections, analytics, audit, idempotency and resets to the server-derived workspace and generation. Check slot overlap inside the locked transaction so two parallel requests cannot reserve the same agent or listing. Reset replaces only that product generation and rejects in-flight actions from the old generation. Other browser contexts and product workspaces remain independent. Use the existing one-hour sessions and state/action bounds. Verify fixture size and select per-collection caps within those bounds before enabling new writes.

An additive migration allows the previous app build to keep serving its supported routes. Before implementation changes the local database, verify a current backup using the existing scratch restore procedure. Rehearse restore against the selected archive if database rollback is needed. Keep actual database switches a separate operation.

## Acceptance plan

| Layer | Observable pass criteria |
| --- | --- |
| Domain | Reject invalid dates, money, missing or archived associations and unauthorized transitions. Verify keyboard and board moves use the same rules. Prove cancellation releases a slot, adjacent slots are allowed, and an invalid reschedule preserves the original booking. Verify overdue boundaries with a fixed clock and reconcile the analytics fixture above. |
| PostgreSQL | Under the runtime role, test fail-closed RLS and read, write and reset isolation across two Property workspaces and each existing Labs product. Parallel conflicting claims yield one accepted booking. Identical retries produce one effect. Stale versions, cross-workspace IDs and stale generations fail. Reload and a restart rehearsal preserve valid records and audit history. |
| Playwright | Create a listing and contact, add a lead, assign an agent, move stages by keyboard, book a viewing, attempt a conflict, complete a follow-up, close the lead and reconcile analytics. Reload, switch demo roles, verify redaction, and reset with a second browser context. Test error recovery after a lost response. |
| Responsive UI | Check 375, 768 and 1440 px in both themes. Verify keyboard navigation, focus after move and reset, labels, no page-level horizontal overflow, and accessible empty, conflict and expired-session states. Run the existing axe checks against populated views. |
| Regression gate | Fresh build, typecheck, brand checks, legacy website/demo suite, full Labs browser/API suite and platform/Cafe/Commerce/Automation unit and database suites. Run Ledger Lite tests from its installed local toolchain. Verify earlier routes and acceptance-only endpoints against the ordinary localhost build. Record actual results before manual review. |

## Execution, effort and cost

| Work package | Engineering days |
| --- | ---: |
| Domain, fixtures, PostgreSQL migration and permissions | 1–1.5 |
| Listings, contacts, leads, assignments and pipeline UI | 1.5–2.5 |
| Viewing scheduler and follow-up workflows | 1–1.5 |
| Analytics and responsive accessibility pass | 0.5–1 |
| Integration, browser regressions, recovery rehearsal and handoff | 1–1.5 |
| **Total** | **5–8** |

Estimate assumes one engineer, six focused hours per day and reuse of the current runtime and UI. Allow roughly 6–10 days with contingency for scheduling races, accessibility and restore verification. Incremental paid-service cost is **RM0** using the existing machine, local PostgreSQL, npm, Chrome and the installed Flutter toolchain. For budgeting only, the programme's assumed RM600–1,000 per engineering day gives RM3,000–8,000 base labour equivalent, or RM3,600–10,000 with the rounded contingency. These are planning assumptions. Hosting, paid services and real customer integrations are excluded.

Use the existing role templates under [programme tooling](TOOLING.md). Alex owns integration and scope, Sam owns domain and database work, Mia owns responsive design and keyboard flow, Ada owns isolation and acceptance review, Cleo reviews demo copy, and Ava records effort and operating costs. Assign one writer per file set and integrate shared changes sequentially. Reuse already available MCP capabilities where they help and local Playwright and PostgreSQL commands for verification. The plan requires no new connectors or agent configuration activation.

User approval authorizes this local MVP and its test and documentation work. M6 and M7 are outside this milestone.
