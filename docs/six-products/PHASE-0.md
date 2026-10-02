# Six interactive products — Phase 0

Current update, 24 November 2026: this document retains historical planning. The [master backlog](../roadmap/MASTER_BACKLOG.md) is authoritative. M1–M4 are accepted; local M5–M12 work is delivered in REVIEW under the user's explicit continuation authorization. Founder acceptance remains pending. No purchases, public deployment, production changes or external messages are authorized by implementation completion.

Prepared 5 November 2026, Asia/Kuala_Lumpur. **Status: audit and planning delivered; new platform and Cafe MVP await plan approval.**

**Implementation update, 9 November:** the user accepted M1/M2 automated and manual testing, approved closing both milestones, and authorized M3 Commerce Studio. M4 and later remain unapproved. See [M1/M2 verification](M1-M2-REPORT.md) and [current progress](PROGRESS.md); the original planning record below is historical.

M3 passed user manual acceptance; closing M3 and implementing M4 AI Automation Hub is now explicitly approved. M5 and later remain unapproved. See [current progress](PROGRESS.md). Historical approval boundaries below are superseded only for M1–M4.

## Decision

Extend `D:\WORKKK\kezuvio`. Do not create a duplicate project in the proposed `D:\Kezuvio-Labs` (that directory was absent during inspection). Retain the existing website, six old demo URLs, branding and Ledger Lite. Build the shared data/session foundation, then one integrated Cafe POS before moving to another product.

The source brief asks: “Then proceed with the shared platform and Cafe POS MVP after approval.” The current request starts this programme; this delivery makes that next implementation scope reviewable. No new application functionality, hosting or paid services are included in Phase 0.

## Deliverables

- [Architecture and isolation](ARCHITECTURE.md): workspace layout, dependencies, database contracts, resets and deployment.
- [Milestones and acceptance backlog](BACKLOG.md): ordered work, owner, estimate, dependency and observable completion criteria.
- [Design system](DESIGN.md): retained brand, application shell, Cafe screen plan and accessibility.
- [Agent and MCP tooling](TOOLING.md): six role templates, two reusable skills, dependency verification and activation limits.

## Current environment and evidence

| Check | Observation on 5 November |
| --- | --- |
| Workspace | Existing Git repository; npm workspaces `apps/*`, `packages/*` |
| Runtime | Node 24.21.0, npm 11.19.0, Git 2.56.0.windows.2 |
| Installed application packages | Next.js 16.4.3, React 19.3.1, TypeScript 7.0.2, Playwright 1.64.1 |
| Data/runtime tools | `docker`, `psql`, `redis-server` not found on PATH; this does not prove they are absent everywhere |
| Codex | CLI 0.163.0-alpha.11.1; version/MCP listing worked with warnings about inaccessible temporary alias directories |
| Python | WindowsApps alias could not execute; bundled runtime located separately for skill validation |
| Repository instructions | Existing `apps/website/AGENTS.md` requires installed Next.js docs; root instructions added in this phase |
| Unit checks | `npm run test:unit`: 9 passed, 0 failed |
| TypeScript | `npm run typecheck`: passed |
| Brand | `node scripts/check-brand.mjs`: passed; logos, fonts and contrast assertions |
| Browser/build/hosting | Not rerun in this documentation phase; previous reports are historical evidence only |

Pre-existing work at initial inspection: modified `.gitignore`, `apps/website/app/layout.tsx`, `apps/website/next-env.d.ts`; untracked `apps/ledger_lite/`, `apps/website/AGENTS.md`, `docs/previews/ledger-m1/`, `scripts/ledger.ps1`, `tests/navigation-scroll.spec.ts`. Preserve all. Do not overwrite the separate Android `PLAN.md` or historical discovery/delivery reports.

## Reuse and gaps

| Requested product | Evidence in repository | Remaining work |
| --- | --- | --- |
| Cafe POS & QR Ordering | `components/demos/qr.tsx`, `commerce.tsx`; menu/table/cart/kitchen, retail POS shifts, receipts, mock tender, refund, stock/report | Unified cafe catalog/order/payment/stock; cafe staff capabilities; database persistence and safe concurrency |
| AI Automation Hub | Company enquiry UI only | Inquiry records, deterministic analysis/quotation, queue, execution history, human approval, follow-ups |
| Commerce Studio | `commerce.tsx`, `lib/demo/engine.ts`: catalog, search/filter, promo, cart, checkout, fulfilment, stock | Separate seller/product boundary; persistent atomic checkout; independent reset |
| Property CRM | Booking and contact components offer reusable UI | Property/lead domain, agent assignment, Kanban, appointments/reminders and analytics |
| Accounting Cloud | `management.tsx` and `totals()` implement basic cash-basis reporting/invoices | New chart of accounts, balanced journals, receivables/payables, statements, reconciliation and inventory valuation |
| Interior 3D Studio | Brand/UI primitives only; no Three.js dependency | Optimized room scene, transforms, materials, quote, persistence and screenshot export |

The independent Flutter app `apps/ledger_lite/` is a cash-flow product, not Accounting Cloud. Reuse concepts and test cases only where appropriate; do not change its scope or data model here.

Existing `lib/demo/server.ts` provides visitor isolation, HttpOnly cookies, origin and CSRF validation, body/rate limits and bounded idempotency. However it holds all demo state in one process, shares roles across products and returns the whole state. Existing reset clears every demo. QR kitchen orders do not enter POS sales or cafe inventory. These are intentional old-demo limitations to address in the new foundation, not evidence of a complete platform.

## Time and cost estimate

These are engineering planning assumptions, not vendor quotes or promised delivery dates. One engineer with agent assistance; one person-day means roughly six focused engineering hours, including review. Existing code reuse is assumed. Excludes customer research, custom artwork, real integrations and production compliance review.

| Stage | Estimated person-days |
| --- | ---: |
| Shared platform and database foundation | 5–8 |
| Cafe MVP integration and acceptance | 6–10 |
| Commerce migration | 3–5 |
| Deterministic Automation Hub | 5–8 |
| Property CRM | 5–8 |
| Accounting Cloud | 10–16 |
| Interior 3D Studio | 7–12 |
| Portfolio integration and launch preparation | 3–5 |
| Total after Phase 0 | 44–72 |

Add 20% contingency: approximately **53–87 person-days**, or **11–18 working weeks** for one dedicated engineer. Shared foundation plus Cafe is 11–18 days before contingency. Re-estimate after its integration tests; database setup, accounting rules and 3D device performance are the largest uncertainties.

For internal budgeting only, an assumed RM600–1,000 per engineering day gives RM26,400–72,000 before contingency (roughly RM31,700–86,400 with 20%). This is arithmetic from assumed rates, not a Malaysian market-rate claim. It does not predict this chat's elapsed completion time or AI subscription bill.

| Operating scenario | Planning reserve | Assumptions |
| --- | ---: | --- |
| Local development | RM0 incremental service spend | Existing machine/subscriptions, deterministic AI, no hosted database |
| Low-volume hosted showcase | RM150–400/month | One Node service, small managed PostgreSQL, basic logs/backups; no dedicated worker/Redis |
| Worker/Redis added later | Additional RM50–200/month | Only if durable asynchronous jobs require them |
| Domain | RM60–150/year reserve | Registrar/TLD dependent; no domain chosen or purchased |
| Paid AI, email, WhatsApp, payments | RM0 in demo plan | Simulated/local output only |

Reserves are deliberately uncommitted budget envelopes; storage, bandwidth, seats, taxes and currency changes can increase cost. [Render's official pricing page](https://render.com/pricing) was inspected, but its extracted content did not expose numeric plan rates, so no verified vendor total is asserted. Obtain a region-specific quote and spending approval before choosing hosting. A free tier is not assumed to satisfy persistence or uptime needs.

## Immediate implementation approval scope

Approve **M1 + M2 only** in the backlog: verify local PostgreSQL setup, add product-scoped sessions/repositories/migrations, integrate Cafe at `/demo/cafe-pos`, and test the complete ordering/settlement/reset flow while retaining existing routes. No other new product, public deployment, paid provider, production modification or real messaging is included. Docker installation is an option, not a prerequisite if a suitable local PostgreSQL instance is available.

## Progress record

- 2026-11-05: inspected workspace and installed versions; ran three baseline checks; Ada subagent completed read-only reuse/isolation review.
- 2026-11-05: verified official framework, database, agent and MCP sources; produced architecture, backlog, design, role templates and skill drafts.
- 2026-11-05: seven TOML files parse; six role schemas, two skill frontmatters and local document links passed limited structural checks. Official skill validation was attempted but blocked by missing PyYAML; runtime activation remains pending.
- M1/M2: not started. Record future commands, evidence and remaining limitations here at each milestone.
