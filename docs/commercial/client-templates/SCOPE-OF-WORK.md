# Scope of work

Editable delivery baseline · **draft, not approved**. Replace all fields and resolve open decisions before baselining. Legal, IP, privacy, liability and tax provisions require Malaysian professional review; this file does not supply standard enforceable terms.

| Baseline                                      | Value                                                           |
| --------------------------------------------- | --------------------------------------------------------------- |
| SOW ID / revision / project                   | `{{SOW-ID}}` / `{{revision}}` / `{{project}}`                   |
| Client sponsor / process owner / Kezuvio lead | `{{names and roles}}`                                           |
| Brief / proposal / quotation                  | `{{IDs and exact revisions}}`                                   |
| Effective approval / target release           | `{{date/reference or pending}}` / `{{target and dependencies}}` |

## Included deliverables

| ID  | Deliverable / quantity                             | User behaviour and boundaries                                    | Supplied input / owner | Acceptance ID |
| --- | -------------------------------------------------- | ---------------------------------------------------------------- | ---------------------- | ------------- |
| D01 | `{{page/workflow/feature}}`                        | `{{start → outcome; roles, fields, limits and errors}}`          | `{{input/date/owner}}` | AC01          |
| D02 | `{{integration or data import, only if included}}` | `{{provider, sandbox, permitted actions, mapping and rollback}}` | `{{input/date/owner}}` | AC02          |
| D03 | `{{training/source/runbook/handover}}`             | `{{format, session count, recipients and boundaries}}`           | `{{reviewer}}`         | AC03          |

For websites record approved pages, language versions, editing approach and content-entry quantity: `{{inventory}}`. For business software record entities, states/transitions, permission matrix, concurrency/retry behaviour, exports and reconciliation rules: `{{references}}`. Use fictional test examples until a separate real-data handling plan is approved.

## Acceptance scenarios and supported environment

| ID / deliverable | Given / action                                             | Observable expected result                                 | Evidence / reviewer                          |
| ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| AC01 / D01       | `{{user, records and action}}`                             | `{{specific output, amount/status or accessible control}}` | `{{test or manual evidence / client owner}}` |
| AC02 / D02       | `{{invalid input, duplicate request or provider failure}}` | `{{safe rejection, no duplicate/partial write, recovery}}` | `{{evidence / owner}}`                       |
| AC03 / D03       | `{{handover recipient follows documented steps}}`          | `{{named artefact and successful task}}`                   | `{{evidence / owner}}`                       |

Supported browsers/devices/viewport sizes: `{{named versions/devices; distinguish browser emulation from physical-device checks}}`. Accessibility and performance targets: `{{measurable target, test method, dataset and environment}}`. Hosting capacity and expected record/traffic volume: `{{input or excluded pending measurement}}`. Do not substitute a screenshot for a working-flow acceptance result.

## Boundaries, revision allowance and dependencies

Excluded: `{{specific pages/features/integrations/migration/hardware/offline/branches/compliance/support}}`. Options requiring separate approval: `{{items and quote references}}`.

Included reviews: `{{package allowance, typically two consolidated design/workflow rounds}}`. One round means `{{one consolidated decision list from the named client coordinator against the agreed artefact}}`; it does not add new scope. Fixing a failure against an agreed criterion is recorded as a defect. New criteria, content volumes, entity types, integrations or additional review rounds use the [change process](CHANGE-REQUEST.md).

| Dependency                               | Owner          | Required date | Effect if late / contingency   |
| ---------------------------------------- | -------------- | ------------- | ------------------------------ |
| `{{approved content/brand rights}}`      | `{{client}}`   | `{{date}}`    | `{{review schedule}}`          |
| `{{provider access/sandbox/hardware}}`   | `{{owner}}`    | `{{date}}`    | `{{scope fallback}}`           |
| `{{consolidated review and acceptance}}` | `{{reviewer}}` | `{{window}}`  | `{{reschedule affected work}}` |

## Data, operation and release ownership

| Responsibility                                              | Named owner / approved approach                                        |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Real authentication, access approval and offboarding        | `{{owner and permission model}}`                                       |
| Data collection, notices, retention, migration and deletion | `{{owner, approved plan and professional review reference}}`           |
| Hosting, domain, provider billing and renewal               | `{{account owner; costs and caps in quotation}}`                       |
| Backups, restore checks, monitoring and incident intake     | `{{owner, schedule, storage, retention and tested recovery approach}}` |
| Release authority and rollback decision                     | `{{client/Kezuvio named approvers and deployment window}}`             |
| Maintenance and support after handover                      | `{{agreement reference or excluded; no implied ongoing service}}`      |

Credentials transfer through `{{approved secure channel}}`; never attach them here. Record any external sending, payment or production action as an explicit approval for a named environment and action. Demonstration-role selectors are excluded from real authentication requirements.

## Completion and approval record

Acceptance review window and issue process: `{{agreed duration, reviewers and defect triage}}`. Completion requires the [acceptance record](ACCEPTANCE-CHECKLIST.md) and [handover record](HANDOVER.md), with unresolved items explicitly decided. No silence/deemed-acceptance rule is assumed. Financial triggers follow the linked quotation; any document conflict needs written clarification before affected work proceeds.

Client baseline approval: `{{authorised name/date/revision/reference}}`. Kezuvio approval: `{{name/date/reference}}`. Professional review: `{{reference or pending}}`. Approved changes append their CR IDs here: `{{none/list}}`.
