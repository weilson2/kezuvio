# Client acceptance record

Editable review record · **pending client decision**. Passing automated checks supplies evidence; it does not establish client acceptance. Use the exact approved SOW criteria and release. Do not mark an unexecuted test Passed or infer acceptance from silence.

| Review control                     | Value                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| Acceptance ID / revision / date    | `{{ACC-ID}}` / `{{revision}}` / `{{DD MMM YYYY}}`                                   |
| Client / project / reviewers       | `{{client/project}}` / `{{authorised client and Kezuvio participants}}`             |
| SOW / quotation / approved changes | `{{IDs/revisions/CRs}}`                                                             |
| Release / environment / review URL | `{{commit/build identifier}}` / `{{local/staging/approved production}}` / `{{URL}}` |
| Data and device setup              | `{{fictional dataset/reset state; named devices/browsers}}`                         |

## Evidence and manual scenarios

Use **Not run**, **Pass**, **Fail** or **Blocked** for each scenario. Record observed results separately from expected results. A blocked device/provider check remains open rather than passing by analogy.

| AC / deliverable         | Steps and expected result from SOW                           | Actual result / evidence reference                          | Status / reviewer / date |
| ------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------ |
| `{{AC01/D01}}`           | `{{role → input/action → expected outcome}}`                 | `{{observed behaviour, exact amounts/status, capture/log}}` | `{{status/name/date}}`   |
| `{{AC02/D02}}`           | `{{invalid/duplicate request; no partial/duplicate record}}` | `{{observed result}}`                                       | `{{status/name/date}}`   |
| `{{AC03/D03}}`           | `{{saved change → refresh → same authorised record}}`        | `{{observed result}}`                                       | `{{status/name/date}}`   |
| `{{access criterion}}`   | `{{permitted user vs forbidden user/workspace}}`             | `{{observed result; real auth if in SOW}}`                  | `{{status/name/date}}`   |
| `{{UI criterion}}`       | `{{keyboard, focus, supported mobile/desktop, error state}}` | `{{named devices; emulation identified}}`                   | `{{status/name/date}}`   |
| `{{recovery criterion}}` | `{{agreed backup/restore/rollback exercise}}`                | `{{environment and artefacts; limits}}`                     | `{{status/name/date}}`   |

Automated verification record: `{{command/check, build/environment, actual result/count, log location and date}}`. Checks not run: `{{check and reason}}`. Demo fixtures are useful examples only; replace them with this project's approved expected results.

## Issues and disposition

| Issue / linked AC | Observed gap / severity                       | Owner / target   | Retest evidence / disposition                                               |
| ----------------- | --------------------------------------------- | ---------------- | --------------------------------------------------------------------------- |
| `{{ISSUE-ID}}`    | `{{specific defect or out-of-scope request}}` | `{{owner/date}}` | `{{open / fixed and retested / deferred by named approval / CR reference}}` |

Known limitations presented to the client: `{{supported scope, dependencies and exclusions}}`. Any deferred issue must identify its practical impact and written decision. A new feature request goes through the [change request](CHANGE-REQUEST.md); it must not conceal an unresolved agreed criterion.

## Separate release and handover decisions

| Decision                                   | Required record                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Acceptance of the identified deliverables  | `{{client decision below}}`                                                                             |
| Permission to publish or switch production | `{{explicit approver, environment, action, window and rollback reference; pending if absent}}`          |
| Payment milestone                          | `{{linked quotation trigger and separate invoice/payment record; acceptance is not a payment receipt}}` |
| Transfer and ongoing support               | `{{handover ID; maintenance agreement or excluded}}`                                                    |

## Client decision

Select one and complete the record:

- [ ] **Accepted** for the identified release and listed deliverables.
- [ ] **Accepted with listed agreed exclusions/deferred issues**: `{{issue IDs, impacts and decision reference}}`.
- [ ] **Changes required before acceptance**: `{{failed AC/issue IDs and next review date}}`.
- [ ] **Review incomplete**: `{{blocked/not-run items}}`.

Authorised client name/role/date/written reference: `{{value}}`. Kezuvio reviewer/date: `{{value}}`. The wording and effect of conditional acceptance, warranty or payment consequences require Malaysian professional review and project-specific agreement. No automatic waiver or deemed acceptance is supplied by this template.

Next: complete the [handover record](HANDOVER.md), reconcile open issues and record any separately authorised release.
