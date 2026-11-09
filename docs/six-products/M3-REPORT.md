# M3 — Commerce Studio

Closure update, 9 November 2026: the user passed manual acceptance and approved closing M3 and starting M4 AI Automation Hub. The original delivery record below is retained as evidence. M5 remains unapproved. See [current progress](PROGRESS.md).

9 November 2026, Asia/Kuala_Lumpur. **M3 implemented and verified; stopped for user review.** M4 and later products have not started. No real payments, purchases, public deployment or production resources.

## Scope and reuse

Commerce Studio is available at `/demo/commerce-studio`, linked from `/demo`. It reuses the existing Commerce Demo's Kedai goods, product tiles, filters, totals, controls and brand tokens, plus the shared Labs session/shell/API/repository. The legacy `/demo/e-commerce` route continues to operate independently with its existing POS/SME behavior. Cafe, website, other legacy routes and Ledger Lite are preserved.

- Customer: search/category filters, product details, persisted cart quantities/removal/clear, `EVOLVE10` coupon, simulated Card/QR checkout and decline, saved order history and fulfilment status.
- Manager (simulated seller): create/edit products, archive/restore, adjust inventory with a note, inspect stock movements, advance orders from Paid to Packed to Shipped to Delivered, issue a full mock refund, and view reconciled sales/stock totals.
- Viewer: read-only sales summary. Customer data excludes other customers' orders/carts and seller movement notes. All roles are selectable demo examples, not real staff authentication.

Products are archived rather than deleted so historical orders retain immutable names/prices. Manager edits never rewrite accepted orders. Money is integer sen; a whole-order 10% discount rounds half-sen ties upward. Net sales = gross before discounts − discounts − full refunds. No tax, delivery charges or compliance claim is included.

## Persistence and concurrency

The additive fifth migration creates `commerce.documents`, a bounded JSON aggregate in its own schema, with composite product/workspace identity, foreign keys, forced RLS and database checks for stock, prices, identifiers and required shape. Repository selection uses a fixed table mapping. Product/workspace/customer identity comes from the server session, never action arguments. The runtime role remains a non-owner without DDL or RLS bypass.

Cart edits use a version; checkout requires current cart and catalogue versions. The server resolves product availability, current prices and coupon rules. One workspace lock and transaction commit order, stock movements, cart clearing and durable request history together. Repeated identical requests cannot sell twice; reusing a key for different arguments fails. A decline or rejected action leaves product state unchanged. Carts do not reserve stock; concurrent customers cannot oversell. Stock or price changes require reviewing the refreshed cart.

Only unshipped Paid/Packed goods may be restocked during a refund. Shipped/Delivered orders allow a full refund without restocking. A refund happens once; multi-line capacity failures roll back all lines. Refunds stop further fulfilment. Stock adjustments cannot go below zero or above 10,000 units.

Each browser gets an independent Commerce workspace. Five-second visible-tab polling keeps tabs synchronized; uncertain requests require refresh before further writes. Reset replaces only that product/workspace generation and rejects stale requests. Cafe and legacy data are unaffected. Workspaces expire after one hour even though PostgreSQL survives process restarts; expired sessions require an explicit fresh start.

## Local review

From PowerShell at `D:\WORKKK\kezuvio`:

```powershell
& .\.local\postgresql\runtime\pgsql\bin\pg_ctl.exe status -D .\.local\postgresql\data
# Only if stopped:
& .\.local\postgresql\runtime\pgsql\bin\pg_ctl.exe start -D .\.local\postgresql\data -l .\.local\postgresql\server.log -w
npm.cmd run start
```

Open `http://127.0.0.1:3000/demo/commerce-studio`. The ordinary preview uses local development runtime credentials only; acceptance fixtures remain disabled. If building on another prepared local checkout, run `npm.cmd ci`, `npm.cmd run db:migrate`, then `npm.cmd run build` first. Do not reinitialize the existing cluster or expose it on the LAN.

At handoff, the verified build is running as a hidden localhost-only process on port 3000; PostgreSQL is running on `127.0.0.1:55432`. Its local preview logs are `tmp/commerce-review.stdout.log` and `tmp/commerce-review.stderr.log`. The initial preview-start attempt was not executed because automatic approval review hit a usage limit; after the user continued, the authorized retry succeeded.

Suggested review:

1. Customer: find Everyday notebook, add two, apply `EVOLVE10`. Subtotal RM36.00, discount RM3.60, total RM32.40. A simulated decline preserves the cart and 24 stock. Refresh, disable decline, and check out; one order remains and stock becomes 22.
2. Reload, open My orders, and confirm the purchase persists. Switch to Manager → Orders, then Pack, Ship and Mark delivered.
3. Seller dashboard: gross RM36.00, discounts RM3.60, net RM32.40. Refund that delivered order without restocking; net becomes zero and stock stays 22.
4. Products: create a fictional product, edit its price, archive and restore it. Inventory: adjust stock with a reason. Buy it as Customer, then refund it before shipping with Restock unshipped items selected.
5. Open another browser profile for a separate workspace. Reset Commerce in the first profile; Cafe and the second visitor should remain unchanged.

## Verification

| Command | Actual result |
| --- | --- |
| `npm.cmd run db:migrate` / `npm.cmd run db:migrate:test` | Additive Commerce migration applied successfully to both local databases; runtime grants applied |
| `npm.cmd install --package-lock-only --ignore-scripts --offline` | Passed; lockfile adds only the local Commerce workspace, no external dependency |
| `npm.cmd run test:unit` | 8 passed |
| `npm.cmd run test:platform` | 27 passed |
| `npm.cmd run test:cafe` | 30 passed |
| `npm.cmd run test:commerce` | 32 passed: 19 domain and 13 PostgreSQL integration tests |
| `npm.cmd run typecheck` | Passed |
| `node scripts/check-brand.mjs` | Passed |
| `npm.cmd run build` | Passed, including rebuild after keyboard-access fix |
| `npm.cmd test` with `CI=1` | Brand + 8 domain + 51 legacy browser/API tests passed |
| Flutter `test --no-pub` | 32 existing Ledger Lite tests passed using the local SDK/cache |
| `npm.cmd run test:labs` | 25 passed on the corrected fresh build (10 Commerce + 11 Cafe + 4 platform, 1.6m) |
| `node scripts/labs-commerce-restart.mjs prepare`, graceful `pg_ctl stop/start`, then `verify` | Passed: session, saved cart, order, stock and duplicate checkout history survived actual PostgreSQL restart |
| `git diff --check` and preserved-file hashes | Passed; unrelated layout, navigation-scroll test and Ledger script hashes unchanged; no M3 files staged |
| Ordinary preview smoke checks | Commerce, legacy shop and Cafe pages/API return 200; acceptance fixture page/API return 404; retired QR route returns 308 |

**205 distinct tests passed** across web domain/database/browser suites and Ledger Lite, plus build, typecheck, brand, migrations, backup restore and actual restart checks. Screenshot QA inspected the [desktop catalogue](../previews/commerce-m3/desktop-catalogue.png) and [mobile dark seller dashboard](../previews/commerce-m3/mobile-dashboard-dark.png). Additional [mobile catalogue](../previews/commerce-m3/mobile-catalogue-dark.png) and [desktop dashboard](../previews/commerce-m3/desktop-dashboard-dark.png) captures are supplied for review.

The integration suite covers competing customer carts for the last unit, same/different request IDs, persisted order snapshots, invalid coupons and injected prices, stale cart/catalogue versions, declines, permissions, cross-workspace/product reset, reset/checkout races, refund races/capacity rollback, forced-RLS reads/writes, database constraints and expiry. Browser tests cover complete buyer/seller workflows, cart reload, unshipped restock, keyboard inventory adjustments, lost-response recovery, tab synchronization, cookie/API isolation, and populated views at 375/768/1440px in both themes.

Failures and corrections: the first full M3 Labs run passed 21/25. Three accessibility cases found the inventory table scroll wrapper was not keyboard-focusable; it now has a focusable, named region. One platform test failed during trace cleanup because two suites shared an output directory; Labs artifacts now use `tmp/playwright-labs`, and final browser runs are sequential. The first Flutter attempt lacked permission for its normal local tool-state file; the authorized retry passed. An earlier database-test attempt was not executed because automatic approval review hit a usage limit; after the user continued, the same authorized command passed. No unsafe workaround or purchase was used.

## Backup, boundaries and readiness

M1/M2 closure commit/tag, explicit staging exclusions, private pre-M3 backup manifest and restore verification are recorded in [progress](PROGRESS.md). `npm.cmd run db:backup` produces new local custom-format archives and verifies them by restore into unique scratch databases. Source data is not replaced. Archives remain under the protected, ignored `.local/postgresql/backups/` directory. This is local same-cluster recovery evidence; an off-device backup and equivalent roles would be needed for disaster recovery.

Demo bounds: 100 products including archived items, 50 carts, 50 orders, 20 distinct items per cart, 99 units per line, 2,000 stock movements, 256KB state, 500 actions per generation, 100 generations. Schema outer bounds allow up to 100 carts/orders, but domain limits are stricter. Session/request/admission limits from M1 remain in effect. Reset is the intended recovery when limits are reached.

Incremental paid-service cost: RM0. Existing machine, electricity and agent subscription costs are excluded. No hosted database, payment processor, messaging or other service was purchased. There is no public deployment. Hosted CI, Android-device tests and external disaster recovery have not been run. Public deployment requires separate authorization, hosted database/role provisioning, origin/secrets configuration, backup/monitoring and hosted smoke tests. M3 is left uncommitted for review; M4 will not start without approval.
