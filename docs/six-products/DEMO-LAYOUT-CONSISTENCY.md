# Consistent demo layout — 9 November 2026

The existing demos, Café POS and platform check now use one `DemoFrame` for the heading, category, demo badge, back navigation and shaded workspace. Café controls reuse the existing toolbar styling, and its work-area selection uses the brand button colours. Conflicting Labs layout styles were removed. Product state, roles, expiry and reset boundaries remain independent.

The user also requested a clearer “All demonstrations” link. All demos now show it as an outlined navigation control with 15.2px text, a spaced arrow, and a minimum 44px click target on desktop and mobile.

Legacy receipt print visibility rules are scoped to pages containing `#demo-print` so loading the shared CSS does not hide Café receipts. Café print rules account for the shared heading and workspace.

## Verification

- `npm run test:unit` — 8 passed.
- `npm run typecheck` — passed.
- `node scripts/check-brand.mjs` — passed.
- `npm run build` — passed, run outside the sandbox for required Windows junction creation.
- `npx playwright test --config playwright.labs.config.ts tests/labs/cafe.spec.ts tests/labs/platform.spec.ts` — 15 passed against a fresh build and dedicated test database. Includes café lifecycle, receipt print, roles, isolation, reset focus, recovery and accessibility at 375/768/1440px in light and dark themes.
- `npx playwright test tests/demos.spec.ts --grep "demo accessibility|business theme|POS|e-commerce"` — 8 passed against the restarted local preview. Covers accessibility for all five existing demos and business editing, retail POS receipt/refund, and commerce journeys.
- `node tmp/demo-layout-review.mjs` — passed at 1680px and 375px. Compared Café POS with commerce: heading alignment, title size, workspace width and back-link dimensions match; portal navigation starts at scroll position zero with the header visible; neither page overflows horizontally. Captured screenshots under `tmp/qa/consistent-demos/`; desktop and mobile Café plus desktop commerce were visually inspected.

No failures occurred in these checks. Full `npm test` and the remaining browser suites were not run. The local preview on port 3000 was restarted with this build; no public deployment was performed.
