# Kezuvio Labs

Brand system, company website and legacy interactive demonstrations for a proposed Malaysian software studio. The original website and demonstration programme is implemented locally, with launch preparation supplied. Public deployment and real enquiry delivery remain pending. See the historical [delivery report](docs/final-delivery-report.md).

The six-product programme adds the PostgreSQL shared platform, Cafe POS, Commerce Studio, AI Automation Hub, Property CRM, Accounting Cloud and Interior 3D Studio. M1–M4 have passed user acceptance. M5–M12 local work is authorized; delivered milestones remain REVIEW until accepted. The [commercial pack](docs/commercial/README.md) includes editable estimates, eight client templates and launch readiness items. Follow the [master backlog](docs/roadmap/MASTER_BACKLOG.md), [programme progress](docs/six-products/PROGRESS.md) and [M11 verification](docs/roadmap/M11-REPORT.md). No public deployment or real customer delivery is activated.

## Run locally

Use Node.js 24 and npm. The lockfile records exact installed versions.

```sh
npm ci
npm run build
npm run start
```

Open `http://127.0.0.1:3000`, `/demo` for the demonstrations, or `/brand` for the brand workbench. `npm run dev` starts development mode. The five legacy demos use one Node process and in-memory sessions. All six new products use PostgreSQL with independent one-hour workspaces and resets. Saved state survives a restart until session expiry. Local PostgreSQL setup and runtime/migration credentials remain separate from repository source; see the programme guides before running database checks.

## Verify and regenerate

```sh
npm run typecheck
npm test
npm run marketing:generate
npm run pdf:brand
```

Build before browser tests. Tests use installed Google Chrome. Read the Playwright configurations before starting servers. `npm test` runs brand checks, 8 legacy domain tests and61 browser/API tests. For PostgreSQL products run `test:platform`, `test:cafe`, `test:commerce`, `test:automation`, `test:property`, `test:accounting`, `test:interior` and `test:labs` through npm; also run `test:studio`, `test:operations` and the separate `test:operations:rate`. The Labs preview requires the dedicated test database and never development operator credentials. Hosted CI/container execution remains unverified; actual local results and failures are in M11's report.

Run `npm run operations:setup` to prepare the private loopback desk at `/operations`. Sign in using the key in ignored `.local/operations/config.json`; never commit or publish it. The desk records six role handoffs and executes only approved local checks. Live AI dispatch, arbitrary commands and external messaging are not enabled. Project role/skill definitions are in `.codex/agents` and `.agents/skills`; [tooling evidence](docs/roadmap/M10-REPORT.md) describes verified and unverified capabilities.

Marketing generation replaces the generated HTML/CSS files; edit `scripts/generate-marketing.mjs` for lasting template changes. Presentation source is `documents/brand-presentation/`. See [asset instructions](docs/marketing-delivery.md).

## Structure

| Location                                       | Contents                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `apps/website/app`                             | Studio/service pages, eleven demos, inquiry workflow, private operations and scoped APIs |
| `apps/website/components/demos`                | Business, QR, booking, commerce and management screens                                   |
| `apps/website/lib/demo`                        | Typed domain rules, fictional data and session guards                                    |
| `packages/brand`, `packages/ui`                | Shared tokens, typography, components and icons                                          |
| `assets/logos`, `assets/icons`, `assets/fonts` | Original vectors, app icons and licensed Inter                                           |
| `assets/marketing`                             | 18 English/Chinese editable templates and PNG previews                                   |
| `documents/brand-presentation`                 | Editable 12-page presentation and rendered QA pages                                      |
| `output/pdf`                                   | Presentation and delivery report                                                         |
| `tests`, `scripts`                             | Automated verification and artifact generation                                           |
| `docs`                                         | Brand, architecture, evidence, deployment and handover guides                            |
| `.github/workflows/ci.yml`, `Dockerfile`       | Prepared CI and container configuration                                                  |

## Demo routes

| Route                    | Demonstration                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `/demo/business-website` | Ruang Studio: themes, editable preview and sample visit request                                             |
| `/demo/cafe-pos`         | Saji Café: table orders, kitchen, cashier, receipts, refunds, inventory and sales                           |
| `/demo/booking`          | Ruang Bookings: reserve, reschedule, cancel and conflict prevention                                         |
| `/demo/pos`              | Kedai Counter: shift, checkout, receipt, refund, inventory and report                                       |
| `/demo/e-commerce`       | Kedai Everyday: search, detail, promo, checkout and fulfilment                                              |
| `/demo/commerce-studio`  | Commerce Studio: persisted products, inventory, carts, mock checkout, orders and seller dashboard           |
| `/demo/automation-hub`   | AI Automation Hub: fictional inquiries, deterministic analysis, quotation review, workflow and follow-ups   |
| `/demo/property-crm`     | Property CRM: Malaysian sample listings, contacts, leads, viewings, reminders and sales analytics           |
| `/demo/accounting-cloud` | Accounting Cloud: balanced accrual journals, settlements, aging, inventory and reconciled reports           |
| `/demo/interior-3d`      | Interior 3D Studio: original furniture, room controls, saved designs, PNG export and illustrative estimates |
| `/demo/sme-management`   | Alur Workspace: ledger, invoices, contacts, stock, roles and audit                                          |

The old `/demo/qr-ordering` URL redirects to `/demo/cafe-pos`. All six new products have saved workspaces and independent resets. The five legacy demos share a sample workspace across tabs in the same browser profile. Retail POS and the legacy shop share stock and feed SME net sales. Roles are selectable simulations within your own workspace. Use fictional data throughout. The independent Ledger Lite Flutter application remains separate.

## Configuration and limits

Copy `.env.example` to `apps/website/.env.local` and supply approved values. `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_WHATSAPP` add real contact links; rebuild after changes. `SITE_URL` sets canonical URLs and indexing. `DEMO_ORIGIN` pins the exact browser-facing origin behind an HTTPS proxy.

The contact form builds a local enquiry brief that can be copied or downloaded. It does not send messages. No invented contact details, clients, registration status or results are supplied. Privacy and terms remain draft notices for operator review.

Legacy sessions are bounded to 100 active workspaces per Node process, 120 requests/minute per session, and an 8 KB action body. The six Labs products use a bounded transactional PostgreSQL visitor store; their current isolation and limits are documented in the milestone reports. Real authentication is required before production business use. The legacy state and private operations desk currently require one process. Physical printers, offline sync, payment providers, live email and tax/LHDN integration are not implemented.

See the current [verification report](docs/roadmap/M11-REPORT.md), [deployment and recovery runbook](docs/roadmap/M11-DEPLOYMENT.md), [brand guidelines](docs/brand-guidelines.md) and [marketing instructions](docs/marketing-delivery.md). Earlier verification/deployment reports retain historical context. No public deployment, paid service, domain purchase, Git commit or push was performed. Docker and hosted CI are prepared but unverified in their target environments.
