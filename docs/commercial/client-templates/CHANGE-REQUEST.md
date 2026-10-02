# Change request

**Draft — proposed change is not authorised by this record alone.** Use for a change to the approved scope, review allowance, price or delivery assumptions. A defect against an unchanged acceptance criterion belongs in the issue log; assess it before quoting additional work.

| Control                              | Value                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| CR number / revision / date          | `{{CR-ID}}` / `{{revision}}` / `{{DD MMM YYYY}}`                                       |
| Project / requester / decision owner | `{{project}}` / `{{name/role}}` / `{{authorised client decision maker}}`               |
| Current SOW / quotation / proposal   | `{{IDs and exact approved revisions}}`                                                 |
| Classification                       | `{{scope change / additional review / dependency change / defect assessment pending}}` |
| Requested decision date              | `{{date; affected work waits for decision}}`                                           |

## Requested behaviour and reason

Before: `{{approved behaviour, quantity or dependency; cite deliverable/AC}}`.

After: `{{specific requested behaviour and business reason}}`.

Why this is a change: `{{difference from baseline or resolution of defect assessment}}`. If classification is disputed, assign `{{reviewer/date}}` and hold the affected scope; do not silently replace the baseline.

## Options and impact

| Option                         | Deliverable / acceptance difference       | Effort / fee impact                                        | Schedule / operating impact      |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------------------- | -------------------------------- |
| Retain baseline                | `{{existing agreed outcome}}`             | `{{no added change fee; any existing dependency issue}}`   | `{{effect}}`                     |
| Proposed change                | `{{new/replaced deliverable and AC IDs}}` | `{{hours, estimate basis and RM amount pending approval}}` | `{{revised dates/dependencies}}` |
| Reduced alternative, if useful | `{{bounded option or remove row}}`        | `{{amount}}`                                               | `{{effect}}`                     |

| Cost reconciliation                       | RM                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| Current approved one-time total           | `{{amount and quotation revision}}`                                    |
| Added work / approved removed-work credit | `{{addition}}` / `{{credit; do not assume refund entitlement}}`        |
| Provider or recurring-cost difference     | `{{item and period; separate from one-time total}}`                    |
| Applicable tax difference                 | `{{professional confirmation pending}}`                                |
| Revised one-time total                    | `{{baseline + addition − agreed credit + confirmed cost/tax changes}}` |

Existing invoiced/paid amounts: `{{references and verified amounts; do not infer payment}}`. Proposed payment-milestone change: `{{revised schedule summing to revised total}}`. Update the quotation rather than maintaining conflicting totals. Cancellation, credit/refund, IP, liability and tax effects require Malaysian professional review before commercial use.

## Delivery, data and verification

Affected files/features, interfaces, migration or hardware: `{{items}}`. New client inputs and owners: `{{items/dates}}`. New external permissions, services or paid caps: `{{items or none; separate named approval required}}`.

| Revised acceptance ID | Input / action        | Expected result              | Regression or recovery evidence               |
| --------------------- | --------------------- | ---------------------------- | --------------------------------------------- |
| `{{AC-ID}}`           | `{{worked scenario}}` | `{{numeric/status outcome}}` | `{{test method and preserved prior feature}}` |

Rollback/backout plan: `{{how to restore the prior compatible behaviour and preserve data; destructive changes separately authorised}}`. Known trade-offs: `{{limitations and owner}}`.

## Decision and baseline update

- Decision: `{{approved / rejected / deferred / revise}}`.
- Approved option and exact revision: `{{value}}`.
- Client authorised name/date/written reference: `{{value or pending}}`.
- Kezuvio founder commercial approval: `{{value or pending}}`.
- Professional review, if affected: `{{reference or pending}}`.

Only after approval: update the SOW, quotation, acceptance scenarios, schedule and backlog with this CR reference. Record the new baseline `{{IDs/revisions}}` and notify the agreed project participants through an approved channel. Preparing this draft does not authorise sending that notification or beginning changed work.
