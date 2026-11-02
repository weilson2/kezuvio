# Kezuvio Labs - final local delivery report

**31 October 2026 | Workspace: D:/WORKKK/kezuvio**

The brand foundation, company website, six interactive demos, bilingual marketing templates and twelve-page presentation are delivered locally. Production build, TypeScript, 51 browser/API tests and 9 domain tests pass. CI, Docker and deployment instructions are prepared. **The website is not publicly deployed, and the contact form does not send messages.**

The user expanded the original Phase 0/Milestone 1 request to the website, then authorized all remaining tasks and this report. This completed local scope preserves the specification's requirement for separate approval before public deployment or purchases.

## Milestone results

| Milestone | Delivered and checked | Review / limitation |
| --- | --- | --- |
| 1. Brand foundation | Original K, 12 vector lockups, app icons, Inter, tokens, light/dark themes and shared components | Brand is provisional; visual approval and name clearance remain external |
| 2. Company website | All 14 requested company routes plus `/brand`, navigation, service/concept content, metadata and local enquiry builder | Real contacts and live form delivery remain unconfigured |
| 3. Demo portal | Six working routes, product previews, quote links, demo labeling, isolated sessions and reset | One-hour ephemeral sample workspaces |
| 4. First demos | Business editor, QR ordering/kitchen and conflict-safe booking flows | Fictional customers; notifications simulated |
| 5. Advanced demos | POS, shop and SME workflows with shared inventory and reconciled RM totals | Payments simulated; no tax compliance or durable records |
| 6. Marketing/PDF | 18 editable English/Chinese layouts, PNG previews and 12-page presentation | Contact placeholders and copy need release approval |
| 7. QA/deployment preparation | Tests, measured performance, dependency check, CI, Docker, environment and launch guide | Hosted CI, Docker execution and public launch not performed |

## Working demonstrations

- **Ruang Studio - business website:** home, about, services, gallery and contact sections; three themes; editable headline/introduction; local sample visit feedback.
- **Saji Café - QR ordering:** choose table/category/variant, change cart quantities, submit a simulated order, and move it through received, preparing, ready and completed kitchen states.
- **Ruang Bookings:** choose service, fictional date/customer and available slot; confirm, reschedule and cancel; view appointments and simulated notification previews. Conflicting reservations for the same service/time are rejected. The sample week is fixed at 2-6 November 2026.
- **Kedai Counter - POS:** open/close a shift, search/filter products, adjust quantities/discounts, simulate cash/card/QR checkout, inspect/print a receipt, view sales, refund, reconcile the drawer and review inventory/reports.
- **Kedai Everyday - shop:** search/filter, view product details, use the sample `EVOLVE10` promotion, checkout, inspect history, pack/ship orders and view stock.
- **Alur Workspace - SME:** cash-basis overview, income/expenses, customer/supplier samples, stock adjustments, invoices, one-time payment posting, P&L reconciliation and recent audit history.

POS and shop share stock within the visitor's workspace. Sales reduce stock; full refunds restore it and reduce net sales. SME totals add net POS/shop sales to manual and paid-invoice income, then subtract expenses. Unpaid invoices remain receivables. QR food orders are a separate scenario. Money is stored as integer sen. These are demonstrations, not accounting advice or LHDN e-Invoice integration.

## Architecture and safeguards

One Next.js/React/TypeScript application contains pre-rendered pages and two server-side session APIs. Shared brand/UI source packages avoid duplication. A typed pure domain engine validates actions and replaces state atomically within the Node process. No database, external authentication, payment provider, analytics or delivery provider is required for the local demonstrations.

Cookies carry random session IDs; data stays in server process memory. HttpOnly/SameSite cookies, CSRF tokens, origin validation, strict inputs, an 8 KB body cap, bounded records, request replay protection and server-side role restrictions are implemented. The selectable roles demonstrate permissions only inside the visitor's isolated fictional workspace. They are not real employee accounts.

Limits are 100 active sessions per process, 120 requests per minute per session, one-hour expiry and deterministic reset. Same-browser tabs share a workspace; different browser contexts are isolated. Data is discarded on expiry or server restart. Manual refresh updates a second tab; no real-time push is claimed. A shared transactional store and real authentication are needed for multi-instance or production business use.

## Verification results

- Production build and TypeScript: passed.
- Browser/API tests: **51/51 passed**; domain tests: **9/9 passed**.
- Responsive: **294 combinations** across 21 HTML routes, two themes and seven required widths, with no page-level horizontal overflow.
- Accessibility: **84 axe scans**, zero reported WCAG A/AA violations in the scanned initial states. This is not accessibility certification or a substitute for screen-reader testing.
- Brand: 12 self-contained SVGs, icons, fonts and 22 text/control contrast checks passed.
- Production dependency audit: zero reported vulnerabilities at check time.
- Marketing: all 18 layouts passed font/image, boundary and overlap checks and were visually reviewed.
- Presentation: all 12 pages rendered and visually inspected; selectable text, embedded font subsets and vector artwork retained.
- Print: POS receipt and sample invoice exported and visually inspected as single-page A4 outputs.
- SEO: metadata presence, internal links and assets tested. No Lighthouse SEO score or search ranking is claimed; indexing stays disabled until configured.

Local Chrome homepage measurements, three fresh-context runs per viewport, no CPU/network throttling: median FCP/LCP **100/100 ms at 1440 px** and **96/96 ms at 375 px**; observed layout shift **0.00089 / 0.01701**. Transferred bytes were **303,178 / 288,864**. These are local measurements, not field or hosting guarantees. See `verification.md` and `performance-2026-10-31.json` for methodology and evidence.

## Delivered files

| Deliverable | Location |
| --- | --- |
| Setup and project map | `README.md` |
| Company site and demo UI | `apps/website/app`, `apps/website/components/demos` |
| Domain rules and session security | `apps/website/lib/demo/engine.ts`, `server.ts` |
| Shared design system | `packages/brand`, `packages/ui`, `assets/logos`, `assets/icons`, `assets/fonts` |
| Marketing index and 18 sources | `assets/marketing/index.html` and adjacent HTML/CSS |
| Marketing exports | `assets/marketing/previews` |
| Presentation source | `documents/brand-presentation` |
| Presentation PDF | `output/pdf/kezuvio-brand-presentation.pdf` |
| Report PDF | `output/pdf/kezuvio-delivery-report.pdf` |
| Tests and browser report | `tests`, `playwright-report/index.html` |
| CI/container/env | `.github/workflows/ci.yml`, `Dockerfile`, `.env.example` |
| Supporting guides | `docs/brand-guidelines.md`, `marketing-delivery.md`, `deployment-guide.md`, `verification.md` |

To run: `npm ci`, `npm run build`, `npm run start`, then open `http://127.0.0.1:3000/demo`. Use `npm test` to reproduce verification. The preview server used during QA is stopped after handover.

## Remaining launch decisions

1. Approve brand/copy and provide real email, optional WhatsApp and the intended domain.
2. Decide whether to retain the local enquiry builder or implement and test live delivery.
3. Approve a single-instance HTTPS host and budget; configure origin, indexing, proxy behavior and edge abuse controls.
4. Run hosted/container smoke checks and review privacy/terms with the actual operator details.
5. Give explicit approval before public deployment. No domain or service has been purchased.

Local hosting spend is **US$0**. Render's documented free review option is US$0 with 750 monthly workspace instance hours and idle shutdown after 15 minutes, which clears this app's sample state. Usage quotas can cause suspension or charges depending on billing settings. No paid hosting quote is selected; confirm current prices before launch. Sources checked 31 October 2026: [Render free-service documentation](https://render.com/docs/free) and [pricing](https://render.com/pricing).

Docker is unavailable on this workstation, so its configuration is unexecuted. Hosted GitHub Actions has not run because no repository was pushed. Physical thermal printing, offline synchronization, real payments, live notifications, production persistence/authentication, tax integration, Firefox/Safari/device testing and formal accessibility/security audits remain outside the verified local delivery. These limits are disclosed in the interfaces and handover; no production-readiness certification is claimed.
