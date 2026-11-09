# Implementation backlog

Status on 5 November 2026: M0 delivered; all subsequent rows planned. Estimates are engineering person-days, not elapsed agent runtime. Approve M1 and M2 together for the next implementation increment; complete Cafe acceptance before another product. Estimates by milestone match `PHASE-0.md`; individual task ranges are not additional costs.

Update 9 November: the user accepted and approved closing M1/M2 and authorized M3 Commerce Studio. See [current progress](PROGRESS.md) and [M1/M2 evidence](M1-M2-REPORT.md). M4–M8 remain planning only; stop for review after M3.

M3 closure update: E01–E03 passed user manual acceptance. M4 A01–A04 is explicitly authorized; M5 and later remain unapproved. [M3 report](M3-REPORT.md) records delivery evidence; [progress](PROGRESS.md) records closure and M4 status.

## M0 — reviewable foundation plan

Owner Alex, with Ada audit, Mia design and Ava estimate responsibilities. Environment/reuse audit, official sources, architecture, isolation/reset, backlog, design and tooling drafts delivered. Skill/config activation is explicitly separate from draft validation; no new product has been implemented.

## M1 — shared platform (5–8 days)

| ID | Work / owner | Depends on | Acceptance |
| --- | --- | --- | --- |
| P01 | Baseline and DB setup — Sam | Plan approval | Preserve current edits; verify local PostgreSQL endpoint/version; migrations and disposal work against a dedicated test DB |
| P02 | Product package contracts — Sam | P01 | Proper workspace exports; typed errors, sen/date helpers and logging; no business dependency from shared UI |
| P03 | Persistence and isolation — Sam/Ada | P02 | Product schemas, runtime/migration roles, composite scope constraints and RLS tests; forbidden cross-product/workspace reads/writes fail |
| P04 | Visitor sessions and capabilities — Sam | P03 | Opaque scoped session, expiry, role simulation label, endpoint permissions and limited response projections |
| P05 | Reset, idempotency and cleanup — Sam/Ada | P04 | Transactional fixtures, generation checks, durable duplicate handling, stale-tab rejection and bounded scoped cleanup |
| P06 | Shared shell and state UI — Mia/Sam | P02, P04 | Existing tokens; responsive nav, role/expiry/reset controls; meaningful loading, empty and retry states |
| P07 | PostgreSQL CI and contract suite — Ada/Sam | P03–P06 | Fresh migrations/seed; restart persistence; parallel writers; expired/reset requests; legacy domain tests pass |

**M1 completion:** actual PostgreSQL-backed tests pass under runtime permissions. An in-memory adapter alone does not satisfy this milestone. Record setup blockers instead of silently weakening acceptance.

## M2 — Cafe POS MVP (6–10 days)

| ID | Work / owner | Depends on | Acceptance |
| --- | --- | --- | --- |
| C01 | Cafe catalog/table fixtures — Sam | M1 | 8–12 fictional items, variants, 6 tables, bounded sellable stock; deterministic fresh workspace |
| C02 | QR menu and cart — Sam/Mia | C01 | `/demo/cafe-pos` customer view with table deep link, actual scannable QR for a configured reachable base URL, variants/quantities, price validation and unavailable-item state |
| C03 | Order acceptance/reservations — Sam | C02 | Atomic reservation and one order/ticket; concurrent last-item orders cannot oversell; duplicate submit has one effect; pre-preparation cancellation releases stock, later unpaid cancellation records waste |
| C04 | Kitchen board — Sam/Mia | C03 | Ordered ticket lanes and permitted transitions; updates reach cashier/customer within a tested polling interval; pause polling in hidden tabs |
| C05 | Cashier and simulated tender — Sam | C03 | Open/close shift; choose unpaid order; discount/cash/card/QR simulation; atomic one-time settlement; failed tender rolls back |
| C06 | Receipt/printer simulation — Sam | C05 | Preview and print stylesheet; labeled simulation; reprint does not create payment/order; print cancellation leaves sale intact |
| C07 | Inventory, refunds and reporting — Sam/Ada | C05 | Manager adjustments cannot undercut reservations; one full refund only; prepared items never restock; cancellation versus settlement has one outcome; gross/discount/refund/net/shift totals reconcile |
| C08 | Full acceptance and docs — Ada | C01–C07 | Role API tests, two visitor workspaces, reset during checkout, restart/concurrency, mobile/desktop/keyboard and error states; run existing regression suite |

**M2 demonstration:** visitor selects table, orders two drinks, sees kitchen progress; cashier settles the same order, prints a receipt, inspects correct stock and net sales, then resets only Cafe. Include a user guide, tested commands, known limitations and deployment plan. No real payment or physical printer.

Initial file ownership: Sam owns `packages/demo-platform`, `packages/database`, `packages/cafe` and new API routes; Mia owns new `components/labs/cafe` screens after contracts are agreed; Ada owns `tests/labs` and reports. Alex integrates package/lockfile/CI changes sequentially to avoid shared-file conflicts. Existing `components/demos` remains a source of reusable logic/UI, not a wholesale replacement target.

## M3 — Commerce Studio (3–5 days, after M2)

| ID | Work | Acceptance |
| --- | --- | --- |
| E01 | Product/catalog and seller boundary | Separate schema/catalog/stock; no Cafe effects; search/category filters/product detail |
| E02 | Cart, coupons and mock checkout | Atomic stock decrement; coupon rules server-side; repeated checkout safe; oversell/failure tests |
| E03 | Tracking, seller dashboard, restocking | Explicit fulfilment transitions; authorized seller actions; refunds/report totals and reset verified |

Sam owns implementation; Ada verifies. Reuse the existing commerce interactions and tests, adapting only scope and persistence semantics.

## M4 — AI Automation Hub (5–8 days, after M3)

| ID | Work | Acceptance |
| --- | --- | --- |
| A01 | Inquiry and deterministic analysis | Validated fictional inquiry; versioned rules map needs into explainable requirements; same input/version gives same output with no paid API |
| A02 | Quotation draft and approval | Line items, explicit assumed rates, totals and edit/reject/approve states; approval required before a task is marked ready; demo quote never sent |
| A03 | Task queue and execution history | Durable queued/running/succeeded/failed transitions, bounded retry and idempotency; retry cannot duplicate effects; worker restart behavior tested |
| A04 | Follow-up management | Scheduled/manual follow-up entries, overdue/completed views and audit; no external messages; reset invalidates stale tasks |

Default queue execution is explicit user-triggered simulation backed by DB records. A continuously running worker/Redis requires a demonstrated need, cost update and infrastructure implementation. Do not label a static list as an executing queue. Sam implements; Ava validates workflow; Ada tests failures/retries.

## M5 — Property CRM (5–8 days, after M4)

| ID | Work | Acceptance |
| --- | --- | --- |
| R01 | Listings, leads and agents | Fictional searchable listings and lead CRUD, validated associations, scoped assignment |
| R02 | Pipeline | Kanban plus keyboard-accessible move menu; stage changes persist; rejected moves preserve state |
| R03 | Appointments/follow-ups | Agent scheduling conflicts prevented; Asia/Kuala_Lumpur date display; reminder status and overdue state |
| R04 | Analytics and acceptance | Counts/conversion/value totals derive from documented fixture definitions; role/isolation/reset and responsive tests |

Sam implements; Mia checks accessible pipeline; Ada verifies. Reuse appointment conflict concepts, not the old all-products state.

## M6 — Accounting Cloud (10–16 days, after M5)

| ID | Work | Acceptance |
| --- | --- | --- |
| L01 | Accounting semantics and chart | Document accrual/rounding/cost method; account types and opening balances; worked expected fixtures before UI |
| L02 | Journal posting/reversal | Debit equals credit; valid account/period; immutable posted entries; unbalanced or duplicate requests leave no partial records |
| L03 | Income/expense, customer/supplier subledgers | Invoice, purchase, receipt/payment and reversal journals reconcile with control accounts; revenue recognized once |
| L04 | Statements | Trial balance equality; P&L maps account classes; balance sheet satisfies assets = liabilities + equity including retained/current earnings |
| L05 | Bank reconciliation | Fictional statement import/fixtures, one-to-one matching, unmatched differences; duplicate matches rejected |
| L06 | Inventory valuation | Weighted-average cost and COGS fixtures; quantity/cost/rounding/reversal reconciliations; no unsupported negative stock |
| L07 | Accounting QA and scope notices | Automated calculations and API tests plus accessible reports/export; cash-flow demo not represented as full accounting; no compliance claim |

Sam implements; Ada checks numerical invariants independently; Ava records accounting review limitations. Do not move to UI polish or next product while ledger invariants fail. Qualified human validation remains necessary before real financial use.

## M7 — Interior 3D Studio (7–12 days, after M6)

| ID | Work | Acceptance |
| --- | --- | --- |
| D01 | Scene and assets | One room and 6–10 original primitive/optimized furniture models; licenses recorded; lazy-load 3D route |
| D02 | Selection/transforms/materials | Select/add/remove, bounded move/rotate, material/color; keyboard numeric controls alongside pointer gestures |
| D03 | Pricing and design persistence | Deterministic price from catalog/options; versioned validated design JSON; save/reload preserves transforms; isolation/reset |
| D04 | Export and device fallback | PNG screenshot contains room; export errors handled; WebGL unavailable message and useful design summary; performance measured on named devices |

Mia defines spatial controls; Sam implements; Ada verifies transforms/quotes/persistence/export. Target 30 fps on an agreed reference mobile device, first scene assets under 2 MB compressed; record measurements rather than promise all-device performance.

## M8 — portfolio and launch preparation (3–5 days, after M7)

| ID | Work | Acceptance |
| --- | --- | --- |
| W01 | Showcase integration — Cleo/Mia | Six new product cards link only to working routes; preserve old URLs; case studies explicitly demonstrations |
| W02 | Commercial content — Cleo/Ava | Services/pricing assumptions, tech stack, contact brief, configured WhatsApp link and SEO metadata accurate; no fictional client success claims |
| W03 | Release rehearsal — Sam/Ada | Full regression, CI/container and restore rehearsal; secrets/config checklist, runbook, provider quote and rollback plan |
| W04 | Public deployment — Alex | Separate explicit user authorization, verified hosted URLs and deployed smoke tests; otherwise mark prepared, not live |

## Common definition of done

Each product includes fictional seed data, visitor entry, scoped reset, responsive UI, loading/empty/error states, server validation/authorization where needed, domain/API/browser tests, user/developer docs and a deployment plan. Link each claimed feature to executed evidence. Run affected tests first; broaden to full regressions at integration gates. Do not mark future work complete based on scaffold files or screenshots alone.
