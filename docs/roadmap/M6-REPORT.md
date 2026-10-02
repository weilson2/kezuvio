# M6 Accounting Cloud

23 November 2026, Asia/Kuala_Lumpur. **REVIEW**, pending explicit founder acceptance. Latest user authorization permits continuing through M12 without intervening acceptance stops; M7 now follows this verified implementation.

## Delivered behavior

`/demo/accounting-cloud` is a persistent interactive accrual accounting demonstration using the existing Labs session/repository/shell and brand/UI. Manager can maintain chart accounts, fictional customers/suppliers and nonoverlapping accounting periods; post income/expenses/invoices/bills; record partial/full receipts and payments; issue credit notes against unpaid balances; post balanced manual adjustments; and append controlled reversals. Posted journals cannot be edited. Opening balances must precede other entries; the seeded workspace already contains one.

Reports derive from one immutable journal snapshot. General ledger and P&L use selected-period movements. Trial balance, balance sheet, cash, inventory and AR/AP aging are closing inception-to-end balances. Reversals and dated settlements reconstruct historical aging from journal control-account lines rather than current cached document amounts. Trial accounts show closing debit or credit balances, with balanced totals.

Fictional bank statements support exact signed-amount one-to-one manual matching and unmatching without creating postings. Differences remain visible. The inventory demonstration uses moving weighted-average perpetual costing: integer quantities/sen, half-up issue-cost rounding, final issue consumes residual value, no backdating before the last stock movement. Purchases and sales post Bank/Inventory/Revenue/COGS journals. All actions use server-derived product/workspace scope, role validation, optimistic versions where mutable, locked transactions and durable generation/request identity.

## Files and migration

- New `packages/accounting/{model,reports,index}.ts` and package manifest; exact [domain/action contract](M6-DOMAIN-CONTRACT.md).
- New `apps/website/app/demo/accounting-cloud/page.tsx`, `components/labs/accounting-workspace.tsx`, `accounting.css` and domain/DB/browser suites under `tests/labs/accounting*`.
- Shared integration in database repository/Prisma schema, Labs server allowlist, portal, migration grants, root scripts/lockfile and CI.
- Additive `202611230001_accounting`: dedicated document table with fixed product identity/composite scope, forced RLS, bounded JSON shape, balanced integer journals/reversal checks, and a trigger preserving all previously posted journal objects on UPDATE. Applied successfully to test, then development after domain/DB verification. Prior migrations/data/apps remain in place.
- Additive `202611230002_accounting_reconciliation` enforces inventory value and per-document AR/AP cached balances agree with posted control-account lines. Applied to test, corruption-rejection checks passed, then applied to development. Existing migrations were not rewritten.
- Pre-migration verified backup manifest: `.local/postgresql/backups/2026-11-23T08-01-24-225Z-73c8a051/manifest.json`; both snapshots restored/compared in scratch databases and removed. No active connection switch.

Security maintenance alongside this batch: Next pinned to **16.4.5**, scoped Effect override **3.22.1** under `@prisma/config`, Prisma retained at **7.10.1**. Official npm metadata/repository/license/engine/lifecycle/integrity checked before install; lifecycle scripts skipped. `npm audit --json` reports **zero known advisory matches**; previous M5 warnings are historical. This is not a claim of complete security or production readiness.

## Actual verification

| Command/check | Result |
| --- | --- |
| `npm.cmd run test:accounting` | **25/25 passed**: 17 domain + 8 PostgreSQL. Includes fixed numeric fixture, closing trial balance, AR/AP control reconciliation, chronological reversal/aging, half-up COGS, closed periods, bank uniqueness, immutable journal corruption rejection, concurrency/idempotency/RLS/reset isolation. |
| Existing `test:unit`, `test:platform`, `test:cafe`, `test:commerce`, `test:automation`, `test:property` | **8, 27, 30, 32, 27, 30 passed** after patched dependencies/Accounting integration. |
| `npm.cmd run db:generate`, `npm.cmd run typecheck`, `npm.cmd run build` | Passed on Next 16.4.5; no advisory build failure. |
| `$env:CI='1'; npm.cmd test` | **8 domain + 51 browser/API passed**, browser 35.8 seconds, after stopping known prior preview to permit a fresh server. |
| `npm.cmd run test:labs` | **60/60 passed** in 2.8 minutes, including all 9 Accounting cases and the 51 prior Labs journeys. |
| Fresh rebuild then `npm.cmd run test:labs -- tests/labs/accounting.spec.ts` | **9/9 passed** in 25.1 seconds after final mobile-number layout, chronological GL and control-reconciliation corrections. |
| `npm.cmd audit --json`; `npm.cmd ls next effect --all` | Exit 0 / zero advisories; expected patched versions confirmed. |
| Visual capture | [Desktop reports](../previews/accounting-m6/desktop-reports.png) and [mobile overview](../previews/accounting-m6/mobile-overview.png) inspected. Initial mobile summary split a monetary value; scoped one-column mobile stats correction/readable-single-line assertion passed; refreshed corrected mobile screenshot was visually inspected during M7/portfolio capture. |

Initial failures are retained honestly: browser first run 8/9 passed, one assertion expected `RM160.00` but Intl rendered a nonbreaking currency space; corrected assertion matches the locale. First legacy attempt could not claim occupied port 3000; stopped only the known earlier review process and reran successfully. A formatting invocation included Prisma schema, which Prettier cannot parse; no schema rewrite occurred and subsequent scoped formatting passed. None of these attempts are counted as passed tests.

Hosted CI, public deployment, production recovery and regulatory integration are not run. Ledger Lite remains preserved; its 32-test prior verification remains historical until final full-programme rerun.

## Manual numeric acceptance checklist

Use [Accounting Cloud](http://127.0.0.1:3000/demo/accounting-cloud) after the final review preview is started. Select Manager; Customer/Viewer show aggregate reports only. Use fictional data; reset before each independent fixture branch.

1. Fresh reset reports: cash **RM10,149.97**; AR **RM1,250.00**; AP **RM500.00**; stock **2 chairs / RM200.02**; income **RM2,200.00**; expense including COGS **RM1,100.01**; profit **RM1,099.99**; assets **RM11,599.99**; liabilities **RM500.00**; equity including profit **RM11,099.99**; balance difference **RM0.00**. Closing trial debit and credit totals each **RM12,700.00**.
2. Post an additional **RM200** invoice today. AR/income rise RM200; cash stays fixed. Record **RM100** receipt, then **RM40** unpaid credit: document outstanding **RM60**, income increase **RM160**, cash increase **RM100**. Reverse the receipt with a reason: cash returns to baseline and document outstanding becomes **RM160**. The original receipt remains unchanged and a linked reversal appears. Duplicate reversal/overpayment must fail.
3. Filter Reports from/to today for that branch: period P&L profit **RM160**; balance sheet/trial/AR include earlier seed balances. Aging agrees with AR/AP control accounts. Change report date to before the new postings and confirm prior balances return.
4. From a reset, buy one chair for **RM100.02** (3 units/RM300.04), then sell one for **RM200**. Half-up COGS is **RM100.01**; remaining **2 units / RM200.03**. Bank changes by **+RM99.98**, profit by **+RM99.99**, and balance difference stays zero. Invalid quantity/stale/overdrawn stock must leave books/stock unchanged.
5. In Journals post a balanced **RM25 Bank debit / Owner capital credit** adjustment; unbalanced entries and manual AR/AP/Inventory controls must fail. Inspect original/reversal immutable lines. Create a nonoverlapping empty period, close it, and confirm postings/reversals into it fail; overlapping periods fail.
6. Match a seeded bank line to its exact signed Bank journal, then unmatch it. Journal count/totals stay unchanged, duplicate/mismatched claims fail and differences stay visible. Do not expect a real bank import.
7. Refresh and switch roles; internal parties/documents/journals are redacted. Reset Accounting while another browser profile and other demos have saved records; those workspaces remain intact. Check keyboard navigation and 375/768/1440 layouts in both themes.

## Limits, costs, Git and next milestone

Local fictional MYR demo with selectable simulated roles and bounded one-hour workspaces, 150 journals/40 documents and existing action limits. Stock corrections use a subsequent purchase/sale; direct reversal of stock journals is deliberately blocked to protect later costing. Credits apply only to unpaid outstanding balances; cash refunds, tax calculation/filing/MyInvois/LHDN/SST certification and external bank feeds are excluded. Bank statement rows are seeded; new book transactions can create visible differences. Native date input appearance follows browser locale; human report dates use Malaysian formatting.

Additional paid-service cost **RM0**; installed open-source dependencies only. All work remains uncommitted; HEAD `1bc788e`, no acceptance tag. Keep M6 REVIEW after verification; proceed to **M7 Interior 3D Studio** under the user's updated continuation authorization. No public deployment or production operations.
