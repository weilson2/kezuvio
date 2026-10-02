# Project proposal

**Draft for review — unsent and unapproved.** Commercial, intellectual-property, liability, termination, privacy and tax terms require Malaysian professional review before commercial use. Preparing this document does not authorise deployment, purchases or customer communications.

| Document control                     | Value                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Proposal ID / revision / issue date  | `{{PROP-ID}}` / `{{revision}}` / `{{DD MMM YYYY}}`                                                |
| Client / project / Kezuvio lead      | `{{client}}` / `{{project}}` / `{{lead}}`                                                         |
| Brief / quotation / scope references | `{{BRIEF-ID/revision}}` / `{{QUO-ID/revision}}` / `{{SOW-ID/revision}}`                           |
| Review status / validity             | `{{internal draft / client review / approved reference}}` / `{{valid-until date or not offered}}` |

## Problem and intended result

`{{Describe the actual current process, its specific difficulty and the resulting behaviour to deliver. Identify the primary user and completion event. Do not promise unmeasured savings or sales.}}`

Success will be evaluated using `{{baseline and measurable acceptance examples}}`, owned by `{{client process owner}}`. Any expected commercial benefit is an assumption, not a guaranteed outcome.

## Recommended approach and boundaries

Selected starting point: `{{package name}}` from [service packages](../SERVICE-PACKAGES.md). The product demonstrations illustrate workflows with fictional data; their code, settings and roles do not establish production readiness for this client.

| Workstream                | Concrete deliverable / quantity                                     | Client contribution | Acceptance reference |
| ------------------------- | ------------------------------------------------------------------- | ------------------- | -------------------- |
| Discovery and design      | `{{page map, workflow, roles and review artefacts}}`                | `{{owner/input}}`   | `{{AC-ID}}`          |
| Implementation            | `{{pages/features/records/integrations explicitly included}}`       | `{{owner/input}}`   | `{{AC-ID}}`          |
| Verification and handover | `{{devices, test scenarios, training and source/runbook delivery}}` | `{{reviewer}}`      | `{{AC-ID}}`          |

Included review allowance: `{{copy package allowance and specify what one consolidated round covers}}`. A defect against the agreed acceptance criteria is tracked separately from a request to change those criteria. Additional pages, entities, business rules or integrations use a [change request](CHANGE-REQUEST.md).

Explicit exclusions: `{{unpriced work, migration, live payments, external messaging, hardware, subscriptions, tax/regulatory integration, unsupported devices or other relevant limits}}`. Optional items are not included unless the matching quotation line is approved.

## Delivery plan

| Milestone                   | Reviewable output                            | Start dependency                 | Target window / client reviewer |
| --------------------------- | -------------------------------------------- | -------------------------------- | ------------------------------- |
| 1 — scope baseline          | `{{approved SOW, content/data/access list}}` | `{{inputs}}`                     | `{{window/reviewer}}`           |
| 2 — design/workflow review  | `{{prototype and scenarios}}`                | Milestone 1                      | `{{window/reviewer}}`           |
| 3 — implementation review   | `{{staging build and test evidence}}`        | `{{design/content decisions}}`   | `{{window/reviewer}}`           |
| 4 — acceptance and handover | `{{accepted release and handover pack}}`     | `{{resolved acceptance issues}}` | `{{window/reviewer}}`           |

Dates are proposed until inputs, availability and the commercial baseline are agreed. Feedback is coordinated by `{{one client owner}}` within `{{agreed window}}`. Delays or changed dependencies trigger an updated schedule for review; no automatic penalty or deemed acceptance is assumed here.

## Estimate and operating responsibilities

Development estimate: `{{hours/range and basis}}`. Proposed one-time fee: **RM `{{amount pending founder approval}}`**. Recurring support: **RM `{{amount or excluded}}` / `{{period}}`**. Separate provider charges and caps: `{{hosting/domain/API/licences; estimate source/date; unknowns}}`.

Use the [quotation](QUOTATION.md) for the itemised amounts, payment milestones and validity. Identify whether provider costs are paid directly by the client or administered under an approved cap. No paid service starts merely because it appears in the proposal.

Client owns `{{content approval, process decisions, access and user acceptance}}`; Kezuvio owns `{{agreed implementation, verification and documentation}}`; third parties own `{{named dependencies}}`. Hosting, backup, restore testing, monitoring and incident ownership must each name a responsible party in the SOW. Maintenance is separate unless a linked [maintenance agreement](MAINTENANCE-AGREEMENT.md) is approved.

## Decision record

Open decisions / risks: `{{item, impact, owner and date}}`. Professional review reference: `{{reviewer/date or pending}}`.

Founder release for client review: `{{name/date/revision or pending}}`. Client decision: `{{proceed / revise / defer; authorised name/date/reference}}`.

Before work begins, reconcile this revision with the quotation and SOW. If documents conflict, pause the affected work and record the agreed clarification; do not invent an order of precedence. Use the [acceptance record](ACCEPTANCE-CHECKLIST.md) and [handover record](HANDOVER.md) at delivery.
