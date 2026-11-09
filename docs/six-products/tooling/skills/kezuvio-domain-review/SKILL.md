---
name: kezuvio-domain-review
description: Review Kezuvio Cafe, commerce or Accounting Cloud changes for money, stock, posting, concurrency and reset correctness. Use when implementing or auditing these domain workflows, not for general styling or marketing edits.
---

# Kezuvio domain review

Read the changed domain/repository path and its relevant acceptance criteria in `docs/six-products/BACKLOG.md`. Establish whether the target is the legacy cash-basis demo, Cafe/commerce, or the new double-entry accounting domain; do not conflate their contracts. Review with concrete failing cases rather than stylistic preferences.

For money/stock: inspect integer-sen arithmetic and rounding, available versus reserved quantities, transactional settlement, discounts, tender/change and explicit refund/restock semantics. Duplicate or concurrent actions must not oversell, pay twice or restore stock twice. A failure must leave related records unchanged; receipt printing must not post anything.

For accounting: check each posted journal balances, rejected posts are atomic, correction uses a reversal, subledgers match control accounts, invoice/payment do not duplicate revenue, and statements reconcile. Verify costing/COGS rounding and duplicate bank-match rejection with worked fixtures. Do not describe cash-flow totals as a balance sheet or claim regulatory compliance.

For both: trace server-derived scope into reads, writes, joins, reports, idempotency and audit. Check reset/expiry racing with mutations, stale generation replay, cross-workspace references and worker retries. Test with the runtime database role; a passing test as schema owner does not validate RLS.

Run focused tests when permitted and distinguish executed results from inferred risks. Return actionable findings with file/line, reproduction or missing invariant, practical consequence and proposed verification. Do not edit unrelated files or broaden the review into a production certification.
