---
name: kezuvio-security
description: Review Kezuvio authentication, workspace isolation, mutations and tool execution for concrete security failures.
---

Identify the actual trust boundary and read the server-derived identity path. Test cross-workspace access, forbidden roles, CSRF/origin handling, stale generation and idempotency scope with separate sessions. Verify runtime RLS without an owner or BYPASSRLS account. For operations tooling, verify prompts cannot select commands, host paths, credentials or network destinations; approval only covers the named permitted action. Check secret exposure, bounded request/log sizes, safe errors and dependency advisories. Report reproducible evidence, impact and minimal fixes; distinguish a local demonstration from production authentication or compliance. Never print credentials or broaden permissions to make a test pass.
