# Maintenance service proposal

**Editable agreement draft — no active subscription or SLA.** Commercial, renewal/cancellation, liability, warranty, privacy, IP and tax terms require Malaysian professional review before client use. No 24/7 coverage or guaranteed recovery is implied.

| Control                                   | Value                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| Agreement ID / revision / client          | `{{MAINT-ID}}` / `{{revision}}` / `{{client}}`                                        |
| Supported project / baseline / handover   | `{{site/app/version/environment}}` / `{{SOW/ACC/HAND IDs}}`                           |
| Proposed service period / start condition | `{{start/end and explicit renewal decision}}` / `{{handover/access review complete}}` |
| Client service owner / Kezuvio contact    | `{{names and approved channels}}`                                                     |

## Supported assets and initial condition

| Asset / environment           | Owner / access route                                | Supported version / known inherited issues |
| ----------------------------- | --------------------------------------------------- | ------------------------------------------ |
| `{{site/application}}`        | `{{client/provider; secure access reference only}}` | `{{version/issues}}`                       |
| `{{hosting/database/domain}}` | `{{billing and technical owner}}`                   | `{{plan and support boundary}}`            |

An onboarding assessment identifies inherited faults, unsupported dependencies and missing backups before coverage begins. Remediation scope/cost: `{{included line, separate quotation or open decision}}`. Never place credentials in this document.

## Included service allowance

| Service                  | Frequency / quantity / limit                                      | Evidence supplied                                          |
| ------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| Dependency/update review | `{{cadence; staging test and approval before release}}`           | `{{change log and relevant checks}}`                       |
| Backup oversight         | `{{owner, schedule, retention, destination and access}}`          | `{{completed backup evidence; not just a configured job}}` |
| Restore rehearsal        | `{{frequency, isolated environment, dataset and cost allowance}}` | `{{actual restore result and known limits}}`               |
| Small content changes    | `{{requests or hours per period, maximum item size}}`             | `{{approved change and verification}}`                     |
| Issue intake / review    | `{{channels, supported hours and triage scope}}`                  | `{{ticket, disposition and next action}}`                  |

Each included content change has **one consolidated review** unless the approved quotation says otherwise. Define one request: `{{bounded example}}`. Monthly carry-over/overage policy: `{{explicit rule or none; do not assume unused hours roll over}}`. Added features, redesigns and new integrations use a [change request](CHANGE-REQUEST.md).

## Support expectations

Service hours/timezone/holidays: `{{specific hours in Asia/Kuala_Lumpur and agreed exclusions}}`.

| Severity | Concrete example                                | Proposed acknowledgement target within service hours | Update / escalation owner |
| -------- | ----------------------------------------------- | ---------------------------------------------------- | ------------------------- |
| Critical | `{{agreed supported core service unavailable}}` | `{{target to agree}}`                                | `{{owner/channel}}`       |
| Standard | `{{feature impaired with workaround}}`          | `{{target to agree}}`                                | `{{owner/channel}}`       |
| Request  | `{{content or planned improvement}}`            | `{{target to agree}}`                                | `{{owner/backlog}}`       |

Acknowledgement means a person has reviewed the report; it is distinct from resolution. Recovery targets, if required, must specify measurable RPO/RTO, provider dependencies, tested recovery resources and an agreed fee. Until agreed/tested, record them **Uncommitted**. Emergency production action authority: `{{named action boundaries and approver}}`; this agreement does not grant unrestricted deletion or purchases.

## Charges and exclusions

Proposed fee: **RM `{{amount pending founder approval}}` per `{{period}}`**; quotation `{{QUO-ID/revision}}`; tax treatment `{{professional confirmation}}`. Separate hosting/domain/provider/API costs and approvers: `{{items and caps}}`. Extra work rate or quotation method: `{{input; no invented market rate}}`.

Excluded unless named: round-the-clock response, unlimited development, major redesign, unsupported third-party failures, purchased hardware, provider fees, data entry beyond allowance and new compliance integrations. Distinguish excluded external causes from faults in included work; allocate responsibility explicitly rather than assuming a blanket disclaimer.

## Review, exit and approval

Periodic review/report: `{{cadence, work completed, issues and allowance used}}`. Renewal, notice, cancellation, refund and termination assistance: `{{proposed terms pending professional review}}`. On exit, inventory source/configuration, export rights, account ownership, credential revocation, data retention/deletion and any separately priced transition work in a [handover record](HANDOVER.md).

Founder commercial approval: `{{name/date/revision}}`. Client authorised approval: `{{name/role/date/reference}}`. Professional review: `{{reference or pending}}`. Provider activation and production changes still require the named approvals and agreed change process.
