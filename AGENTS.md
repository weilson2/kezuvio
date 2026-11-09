# Kezuvio Labs

This repository contains the studio website, six legacy web demonstrations and an independent Ledger Lite Flutter application. Preserve existing user changes and product boundaries.

## Current work

The new six-product programme is described in `docs/six-products/PHASE-0.md`, with architecture, backlog and tooling documents alongside it. Its Phase 0 is planning; shared-platform and Cafe POS implementation follow user approval of that plan. Later explicit user authorization supersedes this gate; do not ask again for already-authorized work.

## Working conventions

- Inspect `git status --short` and applicable nested instructions before edits. Historical reports are not current verification evidence.
- Before Next.js changes read applicable guides under `node_modules/next/dist/docs/`, as required by `apps/website/AGENTS.md`.
- Reuse `packages/brand` and `packages/ui`; do not replace existing routes or the Flutter app to implement new demos.
- Keep money in integer sen with explicit rounding; domain rules belong outside React components.
- New product repositories must scope reads, writes, authorization, idempotency and resets to the server-derived product/workspace identity. Existing selectable demo roles are not real authentication.
- Use fictional data and simulated payments. Do not claim financial, tax or regulatory compliance.
- Purchases, public deployment and production-resource changes require the user's authorization. Preparing local reviewable artifacts does not.

## Verification

Existing baseline: `npm run test:unit`, `npm run typecheck`, `node scripts/check-brand.mjs`. For application changes also run the affected browser/API journeys against a fresh build; `npm test` includes the existing browser suite. Read `playwright.config.ts` before starting a server. Record actual commands and results, including failures and checks not run.

## Team coordination

For the six-product programme the user requested multi-agent work. Delegate bounded independent tasks when useful, within available concurrency; one owner integrates changes. Alex coordinates scope, Sam implements, Mia designs, Ada reviews correctness/security, Cleo prepares honest demo marketing, and Ava tracks operational costs and readiness. The role templates and fallback orchestration are in `docs/six-products/TOOLING.md`. A role name never grants extra permissions. Avoid concurrent edits to the same files; dependencies and final integration are sequential.
