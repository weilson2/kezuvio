# Quotation

**Unsent draft — no approved price or tax treatment.** Complete the linked scope and obtain founder approval before offering this quotation. Malaysian legal/tax review is required before commercial use; do not insert an assumed SST rate, registration number, tax invoice status or legal remedy.

| Quotation control                               | Value                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| Number / revision / issue date / valid until    | `{{QUO-ID}}` / `{{revision}}` / `{{DD MMM YYYY}}` / `{{date}}`                       |
| Issuer legal name / address / approved contact  | `{{verify before issue}}`                                                            |
| Client legal name / billing details / attention | `{{verify before issue; approved private destination}}`                              |
| Project / proposal / scope / change references  | `{{project}}` / `{{PROP-ID/revision}}` / `{{SOW-ID/revision}}` / `{{CR-ID or none}}` |
| Currency                                        | MYR; present monetary values to two decimal places                                   |

## Included one-time fees

Every line must identify a deliverable in the SOW. Replace the example rows; do not retain blank totals in an issued document.

| Line | Deliverable / SOW reference          | Quantity / unit     | Unit fee RM  | Line total RM             |
| ---- | ------------------------------------ | ------------------- | ------------ | ------------------------- |
| 01   | `{{discovery/design; SOW-D01}}`      | `{{quantity/unit}}` | `{{amount}}` | `{{quantity × unit fee}}` |
| 02   | `{{implementation; SOW-D02}}`        | `{{quantity/unit}}` | `{{amount}}` | `{{amount}}`              |
| 03   | `{{verification/handover; SOW-D03}}` | `{{quantity/unit}}` | `{{amount}}` | `{{amount}}`              |

| Calculation                            | Amount RM                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| Subtotal — sum included line totals    | `{{subtotal}}`                                                                 |
| Approved discount — state basis        | `{{discount or 0.00}}`                                                         |
| Net professional fees                  | `{{subtotal − discount}}`                                                      |
| Separately approved reimbursable costs | `{{itemised costs or 0.00}}`                                                   |
| Applicable tax                         | `{{pending professional confirmation; specify treatment before issue}}`        |
| Total payable                          | `{{confirmed fees + approved costs + applicable tax; pending until resolved}}` |

Calculation policy: compute monetary amounts in integer sen; round each quantity × unit-fee line to the nearest sen, half up, then sum rounded lines. State an agreed alternative explicitly if quantities or tax rules require it. Validate the issued totals independently. A gross-margin estimate used internally is not the quotation fee.

## Recurring and optional costs

| Item                         | Status / amount / period                                 | Payee / source date                              | Activation and cancellation decision          |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------- |
| Hosting / database / backups | `{{excluded or approved estimate}}`                      | `{{provider quote/date; unverified if unknown}}` | `{{client owner/cap}}`                        |
| Domain / licences / API use  | `{{excluded or approved estimate}}`                      | `{{provider/source/date}}`                       | `{{client owner/cap}}`                        |
| Maintenance                  | `{{separate agreement ID, fee and period, or excluded}}` | Kezuvio                                          | `{{start/renewal decision}}`                  |
| Optional deliverable         | `{{option and amount}}`                                  | `{{payee}}`                                      | `{{not included unless explicitly selected}}` |

These rows are outside the one-time total unless a numbered included line explicitly incorporates them. Unknown provider charges remain unresolved; do not represent them as zero actual spending. No automatic renewal is established by this draft.

## Payment and schedule proposal

| Milestone / invoice trigger         | Percentage or fixed amount | Amount RM / due date basis |
| ----------------------------------- | -------------------------- | -------------------------- |
| `{{agreed booking/scope trigger}}`  | `{{input}}`                | `{{amount/terms}}`         |
| `{{implementation review trigger}}` | `{{input}}`                | `{{amount/terms}}`         |
| `{{acceptance/handover trigger}}`   | `{{input}}`                | `{{amount/terms}}`         |

Milestones must sum exactly to the confirmed total; assign any sen remainder explicitly to the final instalment. Deposit, cancellation/refund, late-payment and ownership-transfer terms are **pending professional review and agreement**, not implied defaults. Start date and delivery windows follow the proposal/SOW dependencies, not payment alone.

Revision allowance / exclusions: `{{copy exact linked SOW terms}}`. Changes require a priced [change request](CHANGE-REQUEST.md) before affected work starts. Production publication and provider activation require their separately recorded approvals.

## Review and decision

Internal arithmetic checked by `{{name/date}}`; tax/legal review `{{reference or pending}}`; founder-approved issue revision `{{reference or pending}}`.

Client selection: `{{included scope and specifically selected options}}`. Authorised client decision: `{{name, role, date and written reference}}`. Kezuvio confirmation: `{{name/date/reference}}`.

This template itself is not an invoice, receipt or evidence of payment. Save the final approved revision beside the [SOW](SCOPE-OF-WORK.md); retain superseded revisions for history.
