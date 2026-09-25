---
name: kezuvio-demo-milestone
description: Implement an approved Kezuvio web demo milestone using the existing monorepo, product-scoped data and recorded acceptance evidence. Use for the six-product programme, not the independent Ledger Lite Android app.
---

# Kezuvio demo milestone

Read the root and applicable nested AGENTS.md, then the selected milestone in `docs/six-products/BACKLOG.md`. Check current user authorization and progress; later explicit authorization supersedes earlier planning gates. Do not restart completed milestones or assume all six products are requested in one increment.

Inspect current changes and reuse existing brand/UI and relevant demo logic. Read installed Next.js guides before framework edits. Keep old demo routes compatible. Introduce only packages needed for the selected milestone and verify new dependencies before installation.

New product data must use server-derived product/workspace scope, explicit role capabilities and generation-aware resets. Read `docs/six-products/ARCHITECTURE.md` for the intended contracts; distinguish proposed contracts from actual implementation. Existing shared DemoState and freely selectable roles do not provide production authentication. Keep fictional fixtures and simulated payments visibly labeled.

Before editing shared files, assign one integration owner. Separate pure domain rules from storage and UI. For Cafe, use one order across customer, kitchen, payment and stock; printing has no financial side effect. For new queue work, stale generations must fail before effects commit.

Verify the milestone's observable behavior and failure paths. Run affected domain/API checks, persistence/concurrency tests when data changes, and browser journeys when UI changes. Report precise commands and results, not “tested” based on source inspection. Update the progress record with delivered features, remaining gaps and evidence. Keep purchases/publication/production changes within explicit user authorization.
