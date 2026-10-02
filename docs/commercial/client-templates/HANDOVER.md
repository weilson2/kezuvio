# Project handover record

Editable delivery record · **not proof of acceptance or deployment**. Identify the exact release, recipients and assets delivered. Never paste passwords, tokens, recovery codes or private keys here; use an approved secure transfer and record only completion references.

| Record                             | Value                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------- |
| Handover ID / revision / date      | `{{HAND-ID}}` / `{{revision}}` / `{{DD MMM YYYY}}`                        |
| Client / project / receiving owner | `{{client/project}}` / `{{authorised owner}}`                             |
| SOW / quotation / accepted release | `{{IDs/revisions}}` / `{{commit/build identifier}}`                       |
| Acceptance / open issues           | `{{ACC-ID and actual decision}}` / `{{issue references}}`                 |
| Environment and release approval   | `{{local/staging/production URL}}` / `{{named approval or not deployed}}` |

## Delivery inventory

Use **Delivered**, **Pending**, **Excluded** or **Client-owned**. Link a private artefact location or revision; verify the intended recipient can access it.

| Asset                                | Location / version                                                 | Owner / recipient | Status / verified date |
| ------------------------------------ | ------------------------------------------------------------------ | ----------------- | ---------------------- |
| Source repository and release        | `{{URL/path and commit}}`                                          | `{{owner}}`       | `{{status/date}}`      |
| Design assets/content and licences   | `{{inventory and rights evidence}}`                                | `{{owner}}`       | `{{status/date}}`      |
| Build/deployment configuration       | `{{runbook; no secret values}}`                                    | `{{operator}}`    | `{{status/date}}`      |
| Data schema/migrations/exports       | `{{version, mapping, reconciliation and approved export}}`         | `{{data owner}}`  | `{{status/date}}`      |
| Domain/hosting/provider accounts     | `{{account IDs and billing owner; access transferred separately}}` | `{{owner}}`       | `{{status/date}}`      |
| User/admin instructions and training | `{{guide, recording if authorised, session attendance}}`           | `{{recipient}}`   | `{{status/date}}`      |
| Test/acceptance evidence             | `{{report and supported devices/environment}}`                     | `{{reviewer}}`    | `{{status/date}}`      |
| Backup/recovery and support records  | `{{runbook, restore evidence, maintenance agreement}}`             | `{{owner}}`       | `{{status/date}}`      |

## Operating rehearsal

| Task                                                | Recipient follows                                        | Observed result / date / witness |
| --------------------------------------------------- | -------------------------------------------------------- | -------------------------------- |
| Access the agreed environment                       | `{{login/onboarding guide; real auth if contracted}}`    | `{{result}}`                     |
| Complete the primary business journey               | `{{scenario and expected amount/status}}`                | `{{result}}`                     |
| Update content or perform authorised administration | `{{guide and permission boundary}}`                      | `{{result}}`                     |
| Produce a backup and restore it safely              | `{{isolated target, owner, runbook and recovery scope}}` | `{{actual result or not run}}`   |
| Report an issue and request a change                | `{{channel, hours, severity and CR process}}`            | `{{result}}`                     |

A backup file alone does not prove recovery. Record whether verification used the same machine/cluster or a separate recovery environment. Do not reset real business data as part of a demonstration rehearsal.

## Release, rollback and known limits

Release state: `{{prepared only / staging verified / deployed with named approval}}`. Actual deployment time/operator/evidence: `{{value or not deployed}}`. Production smoke tests and monitoring owner: `{{checks/results or not run}}`.

Rollback trigger / compatible prior release / migration strategy: `{{values}}`. Data loss implications and separately approved restoration/cutover: `{{values; no automatic destructive operation}}`.

Known limitations and deferred work: `{{issue, impact, owner and decision}}`. Outstanding subscriptions/renewal dates/billing contacts: `{{verified references or unknown}}`. Supported browsers/devices and performance measurements: `{{evidence and limits; no blanket device guarantee}}`.

## Ownership, access and support closure

Record approved source/IP/content-licence arrangements by reference: `{{professionally reviewed agreement}}`; do not assume ownership transfers simply because files were copied. Real-data retention/export/deletion and privacy review: `{{owner, dates and approved plan}}`.

- [ ] Secure credential/access transfer confirmed by authorised recipient: `{{reference/date}}`.
- [ ] Temporary access reviewed and revoked/retained by named approval: `{{reference/date}}`.
- [ ] Backup, restore, updates, incident and billing owners each acknowledged: `{{reference}}`.
- [ ] Maintenance start/end/coverage identified, or no ongoing service agreed: `{{MAINT-ID or excluded}}`.
- [ ] Financial state reconciled separately: `{{invoice/payment references; no payment claimed without evidence}}`.

Client receipt acknowledgement: `{{name/role/date/assets received}}`. Kezuvio handover owner: `{{name/date}}`. Remaining delivery action and due date: `{{value or none}}`. Acknowledging receipt does not replace the [acceptance decision](ACCEPTANCE-CHECKLIST.md), legal/tax review or separate publication approval.
