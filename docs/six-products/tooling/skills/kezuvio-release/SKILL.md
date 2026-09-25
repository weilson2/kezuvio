---
name: kezuvio-release
description: Prepare a Kezuvio release candidate, evidence, backup and rollback plan for an authorized environment.
---

Read the current deployment runbook and milestone acceptance state. Verify the intended diff, current build/type/brand and affected domain/database/browser checks. Record unresolved findings and dependency audit date. Rehearse backup restore into a disposable database, preserve migration history, and document rollback compatibility and recovery steps. Separate prepared CI configuration from an actually executed hosted run. Prepare reviewable deployment artifacts locally; never infer production deployment, purchase, publication or acceptance-tag authority from a completed test suite. Leave unaccepted milestones REVIEW and preserve unrelated changes.
