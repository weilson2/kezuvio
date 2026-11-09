# Café demo consolidation — 9 November 2026

The user requested keeping the newer Café POS instead of maintaining two café demos. The portal now lists Café POS once. `/demo/qr-ordering` permanently redirects to `/demo/cafe-pos`, preserving query parameters. The standalone QR component, menu seed, cart kind, order actions and obsolete tests were removed. The other five demos and independent Flutter application remain separate.

## Verification

- `npm run test:unit` — passed, 8 tests.
- `npm run typecheck` — passed.
- `node scripts/check-brand.mjs` — passed.
- `git diff --check` — passed; Git emitted line-ending normalization warnings.
- `npm run build` — initial sandbox attempt failed because Windows denied creation of a required Turbopack junction. Retried outside the sandbox with approved tool permissions: passed.
- `npx playwright test --config playwright.labs.config.ts tests/labs/cafe.spec.ts --grep "portal offers|table ordering, kitchen"` — passed, 2 tests, using the fresh production build and dedicated test database. Covered the single portal entry, permanent redirect with table query, ordering, kitchen lifecycle, declined payment, settlement, receipt, inventory, refund and reset.
- Restarted the identified repository preview on port 3000. A Node `fetch` smoke check confirmed the old URL returns 308 to `/demo/cafe-pos?table=4`, the portal returns 200 with exactly one café link and no old QR link, and the Café POS session endpoint returns 200.

The full `npm test` browser suite and full Labs suite were not run for this focused consolidation. No public deployment was performed.
