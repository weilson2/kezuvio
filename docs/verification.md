# Final verification - 31 October 2026

The final local production build and TypeScript check pass. The full suite passes **51 browser/API tests and 9 domain tests**. The earlier milestone record is preserved in `milestones-1-2-verification.md` as historical evidence.

## Evidence

| Check | Result |
| --- | --- |
| Production build | Pass; all 21 HTML routes generated, API routes dynamic |
| TypeScript | Pass, no diagnostics |
| Domain rules | 9/9 pass: immutable failures, reset, QR, booking conflicts, stock, POS/refunds, shop, invoices/P&L and roles |
| Browser/API suite | 51/51 pass; final run 28.1 seconds on local Chrome |
| Responsive layouts | 294 route/theme/width combinations: 21 routes x 2 themes x 7 widths, no page overflow |
| Widths | 1920, 1440, 1366, 1024, 768, 390 and 375 px |
| Automated accessibility | 84 axe scans: 21 routes x 2 themes x 2 widths, zero reported WCAG A/AA violations in scanned initial states |
| Brand checks | 12 SVGs, icons, licensed fonts, 18 text contrast pairs and 4 focus/control pairs pass |
| Production dependency audit | `npm audit --omit=dev --json`: 0 reported vulnerabilities at check time |
| Marketing | 18/18 layouts; assets/fonts load, no measured content overflow or overlap |
| Presentation | 12 rendered pages visually reviewed; selectable text, vector logos, embedded font subsets |
| Print output | POS receipt and sample invoice exported to A4 and visually checked |
| CI / Docker | Configuration supplied; GitHub runner and Docker runtime not executed |

The browser suite covers all six interactive workflows, local enquiry validation/copy/download, logo downloads, theme persistence, navigation, metadata and internal links. The six demo journeys also passed at 375 px after their desktop run; the suite now uses that narrow viewport for these interactions. API checks cover isolated sessions, cookie flags, CSRF/origin rejection, role restrictions, request replay, concurrent booking claims, malformed/oversize requests, unauthenticated requests, deterministic reset and rate-limit errors.

## Measured homepage performance

Local Chrome against the production build, fresh browser context for each run, three runs per width, no CPU/network throttling. Observation ends one second after fonts load. Full data is retained in `docs/performance-2026-10-31.json`.

| Width | Median FCP | Median LCP | Median load | Observed layout shift | Transferred bytes |
| --- | --- | --- | --- | --- | --- |
| 1440 px | 100 ms | 100 ms | 113.5 ms | 0.00089 | 303,178 |
| 375 px | 96 ms | 96 ms | 107.7 ms | 0.01701 | 288,864 |

These are local measurements, not Lighthouse scores, field Web Vitals or hosting performance guarantees. INP, real network conditions and production SEO ranking were not measured. Metadata presence, asset loading and internal navigation passed; search indexing is disabled until an approved `SITE_URL` is configured.

## Fixes found during QA

- Origin validation now accounts for Next.js normalizing the loopback URL; legitimate local mutations work and cross-origin requests remain rejected.
- Theme button background transitions were removed to avoid a brief low-contrast intermediate color.
- Decorative portal numbering was made readable in accessibility scans.
- Receipt/invoice print CSS collapses unrelated page content instead of leaving blank print pages.
- Chinese story copy uses deliberate line breaks; fixed canvas spacing no longer depends on the browser viewport.

## Limits of this verification

Automated axe scans do not certify accessibility. Screen-reader review, Firefox/Safari, real mobile devices, thermal printing, offline operation, load testing, proxy/HTTPS deployment and persistent multi-instance operation remain unverified. The role selector demonstrates server-enforced permissions inside an isolated visitor workspace; it is not employee authentication. No security penetration test or compliance audit is claimed.

Regenerate browser evidence with `npm test`; HTML report is `playwright-report/index.html`. Screenshots and sample print PDFs are under `tmp/qa`; they are disposable. Presentation page renders and marketing preview checks are retained with their respective source folders.
