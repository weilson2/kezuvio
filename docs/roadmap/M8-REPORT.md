# M8 — Website integration

23 November 2026, Asia/Kuala_Lumpur. **REVIEW**. Current M8 checks passed after the test-harness corrections recorded below. Continue to M9 under the user's updated through-M12 authorization; no founder acceptance, public deployment or price approval is implied.

## Implemented

Preserved the established homepage, About, Services, contact brief flow, brand/themes/navigation and independent concept portfolio. Added a compact six-product homepage summary and a full portfolio showcase with actual local screenshots, feature lists, intended customer types, expandable limitations, related services, Try Live Demo and Request Quotation links. Existing concept anchors and all legacy demo URLs remain intact (QR retains its existing308 redirect).

Added `/pricing`, `/faq`, `/services/ai-automation` and `/request-quotation`; existing Website Development, Custom Software, POS and other service routes are reused. Seven package drafts cover landing/business/e-commerce/POS/CRM/AI/maintenance, including scope/revisions/exclusions/delivery assumptions/options. No selling prices are approved or shown as final. Thirteen factual FAQ answers cover costs, scoping, POS, CRM, supervised AI, e-commerce, maintenance and Malaysian delivery discussions, including KL/JB without claiming offices or clients.

Quotation links preserve service/product/package context. A known package appears in the locally copied/downloaded brief. The existing ContactForm remains a device-local preparation flow; no POST/message/customer integration is activated. WhatsApp/email links remain conditional on approved configuration already supported by the site; no contact number/address was invented. Unconfigured real communications remain an explicit launch item.

## Files and database

New typed `lib/studio-content.ts`, showcase component/CSS, Pricing/FAQ/quotation pages, actual six-product PNG screenshots, `tests/studio.spec.ts` and [content notes](M8-CONTENT-NOTES.md). Updated Home/About/Portfolio, shared service content/header/footer/contact form/contact page/demo portal/sitemap. The legacy image assertion in `tests/website.spec.ts` is updated to scroll visible lazy screenshots and verify decode; hidden theme logos must be checked without scrolling. No database migration or product record change is required. The five legacy demo routes plus QRredirect are explicitly covered.

## Actual verification

- Structured content checks passed: six complete/unique products, all six screenshot paths exist, seven complete draft scopes without RM selling prices, thirteen FAQs; installed Prettier/typecheck passed for owned pages.
- Fresh `npm.cmd run build` passed, including all new routes.
- First `$env:CI='1'; npm.cmd test`: brand +8 legacy domain passed,58/59 browser cases passed. The legacy asset test assumed every image was loaded immediately after page load, which fails for new below-fold lazy screenshots. Updated it to scroll/decode images. Second run progressed through all new product/package/viewport checks; its first scroll implementation also tried a hidden theme logo. Corrected to scroll only visible-layout images while still asserting hidden logo decoding. Final targeted/full results are pending below; failed attempts are not counted as passing suites.
- All8 new Studio tests passed in both runs: six actual-demo/screenshots/service/legacy routes, seven package scopes and local quotation brief/download/noPOST, plus375/768/1440×light/dark full-page axe/overflow across Home/About/Portfolio/Pricing/FAQ/quotation/AIservice.
- Actual [desktop portfolio](../previews/studio-m8/desktop-portfolio.png) and [mobile draft package](../previews/studio-m8/mobile-draft-package.png) visually inspected; no new visual defect found.
- Final targeted `$env:CI='1'; npm.cmd test -- --grep 'internal links resolve'` passed1/1 in4.8s with brand/legacy8 also passing. Across the corrected M8 checks all59 distinct website/browser cases passed; the two earlier full attempts remain58/59, and are not represented as clean full-suite runs. M9/final verification will run the complete suite again.

## Manual acceptance

1. Review Home/About/Services and [software portfolio](http://127.0.0.1:3000/portfolio#software-demos); open all six demos and the expandable limitations. Check original concepts/anchors and legacy routes remain.
2. Compare the seven [draft packages](http://127.0.0.1:3000/pricing). Scope, revision allowance, exclusions, delivery assumptions and options must be clear; price label remains unapproved draft.
3. Follow a package quotation link, prepare a fictional brief, copy/download it and confirm package context and “Prepared locally. Not sent.” No real inquiry or engagement is created.
4. Read [FAQ](http://127.0.0.1:3000/faq) and AI service page. Confirm factual Malaysian positioning without false clients/offices/registration/performance/compliance claims.
5. Inspect mobile/desktop and light/dark themes; keyboard navigation/skip link/forms/details must work. Confirm configured real contact links are a separate founder decision.

Additional paid-service cost **RM0**. Changes remain uncommitted with prior user work preserved; no acceptance tag. Technical SEO, development analytics and the separate fictional controlled inquiry workflow follow in **M9**. Public publication and real message/data arrangements remain outside this local delivery.
