---
name: kezuvio-testing
description: Select and execute meaningful domain, database and browser regression checks for Kezuvio changes.
---

Read `playwright.config.ts` and `playwright.labs.config.ts` before starting servers. Separate development and test databases, and use the dedicated preview with runtime credentials. Trace expected outcomes to the domain rules, not guessed UI numbers. Exercise the invariant, failure path and a real browser/API journey; include concurrency, stale versions, retries and reset when affected. Fresh builds are evidence; historical reports are context. Record exact command, result, count and material failure cause. Never rewrite a valid business rule merely to satisfy a guessed expected value. Do not report a partial retry as a clean full-suite pass.
