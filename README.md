# Kezuvio Labs

Brand system, company website and six interactive demonstrations for a proposed Malaysian software studio. All seven milestones have now been implemented locally, with launch preparation supplied. Public deployment and real enquiry delivery remain pending. Start with [the delivery report](docs/final-delivery-report.md).

The separately approved six-product programme adds the PostgreSQL shared platform, Cafe POS at `/demo/cafe-pos`, and Commerce Studio at `/demo/commerce-studio`. M1/M2 are accepted; M3 is prepared for review. See [programme progress](docs/six-products/PROGRESS.md), the [Cafe guide](docs/six-products/M1-M2-REPORT.md), and the [Commerce guide and verification](docs/six-products/M3-REPORT.md). Five original demos remain available; the retired QR demo redirects to Cafe POS. Ledger Lite remains independent.

## Run locally

Use Node.js 24 and npm. The lockfile records exact installed versions.

```sh
npm ci
npm run build
npm run start
```

Open `http://127.0.0.1:3000`, `/demo` for the demonstrations, or `/brand` for the brand workbench. `npm run dev` starts development mode. The five legacy demos use one Node process and in-memory sessions. Cafe and Commerce require the local PostgreSQL instance described in their guides, persist across restarts, and use separate one-hour workspaces and resets.

## Verify and regenerate

```sh
npm run typecheck
npm test
npm run marketing:generate
npm run pdf:brand
```

Build before browser tests. Tests use installed Google Chrome; `npx playwright install chrome` installs the required channel where supported. Playwright starts and stops its own preview server when one is not already running. `npm test` runs brand checks, 8 legacy domain tests and 51 browser/API tests. For PostgreSQL products also run `npm run test:platform`, `npm run test:cafe`, `npm run test:commerce` and `npm run test:labs`. Run browser suites sequentially so their reports remain intact. With a server running, `node scripts/measure-preview.mjs` measures local homepage performance.

Marketing generation replaces the generated HTML/CSS files; edit `scripts/generate-marketing.mjs` for lasting template changes. Presentation source is `documents/brand-presentation/`. See [asset instructions](docs/marketing-delivery.md).

## Structure

| Location | Contents |
| --- | --- |
| `apps/website/app` | 14 company routes, `/brand`, 6 demo routes and 2 session APIs |
| `apps/website/components/demos` | Business, QR, booking, commerce and management screens |
| `apps/website/lib/demo` | Typed domain rules, fictional data and session guards |
| `packages/brand`, `packages/ui` | Shared tokens, typography, components and icons |
| `assets/logos`, `assets/icons`, `assets/fonts` | Original vectors, app icons and licensed Inter |
| `assets/marketing` | 18 English/Chinese editable templates and PNG previews |
| `documents/brand-presentation` | Editable 12-page presentation and rendered QA pages |
| `output/pdf` | Presentation and delivery report |
| `tests`, `scripts` | Automated verification and artifact generation |
| `docs` | Brand, architecture, evidence, deployment and handover guides |
| `.github/workflows/ci.yml`, `Dockerfile` | Prepared CI and container configuration |

## Demo routes

| Route | Demonstration |
| --- | --- |
| `/demo/business-website` | Ruang Studio: themes, editable preview and sample visit request |
| `/demo/cafe-pos` | Saji Café: table orders, kitchen, cashier, receipts, refunds, inventory and sales |
| `/demo/booking` | Ruang Bookings: reserve, reschedule, cancel and conflict prevention |
| `/demo/pos` | Kedai Counter: shift, checkout, receipt, refund, inventory and report |
| `/demo/e-commerce` | Kedai Everyday: search, detail, promo, checkout and fulfilment |
| `/demo/commerce-studio` | Commerce Studio: persisted products, inventory, carts, mock checkout, orders and seller dashboard |
| `/demo/sme-management` | Alur Workspace: ledger, invoices, contacts, stock, roles and audit |

The old `/demo/qr-ordering` URL permanently redirects to `/demo/cafe-pos`; its standalone implementation has been retired. Café POS and Commerce Studio each have independent persisted, product-scoped workspaces and resets. The five legacy demos share an isolated sample workspace across tabs in the same browser profile: retail POS and the legacy shop share stock and feed SME net sales. Their reset restores that shared sample data. Roles are deliberately selectable simulations, not real employee authentication. No payments or notifications leave the application. Use synthetic data only.

## Configuration and limits

Copy `.env.example` to `apps/website/.env.local` and supply approved values. `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_WHATSAPP` add real contact links; rebuild after changes. `SITE_URL` sets canonical URLs and indexing. `DEMO_ORIGIN` pins the exact browser-facing origin behind an HTTPS proxy.

The contact form builds a local enquiry brief that can be copied or downloaded. It does not send messages. No invented contact details, clients, registration status or results are supplied. Privacy and terms remain draft notices for operator review.

Sessions are bounded to 100 active workspaces per Node process, 120 requests/minute per session, and an 8 KB action body. This is a low-volume demo architecture. It needs a shared transactional store and real authentication before production business use or multiple replicas. Physical printers, offline sync, payment providers, live email and tax/LHDN integration are not implemented.

See [verification](docs/verification.md), [deployment/security guide](docs/deployment-guide.md), [brand guidelines](docs/brand-guidelines.md) and [marketing instructions](docs/marketing-delivery.md). No public deployment, paid service, domain purchase, Git commit or push was performed. Docker and hosted CI are prepared but unverified in their target environments.
