# M12 — Commercial drafts and business readiness

Status **REVIEW**, 24 November 2026. Draft preparation and performance evidence retain their original 23 November dates. Local preparation is delivered for founder review. Nothing was sent, published, purchased or deployed; no client contract, tax treatment or selling price is approved by this report.

## Delivered artifacts

- [Commercial pack](../commercial/README.md): seven package drafts, eight editable client-document templates, sales material and readiness index.
- [Estimate workbook](../../outputs/roadmap-m12/kezuvio-estimates.xlsx) and [model guide](../commercial/ESTIMATE-MODEL.md): editable development hours, internal hourly cost, AI subscription allocation, API, hosting, domain, maintenance/support hours, target margin and proposed selling-price override. Calculations retain integer sen and display RM outputs. Sample figures are explicit internal assumptions, not actual vendor quotes or approved public prices.
- [Service packages](../commercial/SERVICE-PACKAGES.md): Landing Page, Business Website, E-commerce, POS customization, CRM customization, AI automation and Maintenance, consistent with website drafts. Scope, revisions, exclusions, delivery dependencies and options remain visible.
- [Client questionnaire](../commercial/client-templates/CLIENT-QUESTIONNAIRE.md), [proposal](../commercial/client-templates/PROJECT-PROPOSAL.md), [quotation](../commercial/client-templates/QUOTATION.md), [scope of work](../commercial/client-templates/SCOPE-OF-WORK.md), [change request](../commercial/client-templates/CHANGE-REQUEST.md), [acceptance checklist](../commercial/client-templates/ACCEPTANCE-CHECKLIST.md), [maintenance agreement](../commercial/client-templates/MAINTENANCE-AGREEMENT.md) and [handover](../commercial/client-templates/HANDOVER.md). These are editable Markdown templates in the repository's established format, with deliberate fillable fields and revision references. Word format was not requested. Legal/tax terms are flagged for local professional review before commercial use.
- [Sales materials](../commercial/SALES-MATERIALS.md): six factual portfolio descriptions and walkthroughs, service comparison, website copy, a four-week social draft plan and customer FAQ. Fictional demonstrations and limitations remain explicit; no invented clients, offices, certification or ranking/return claims.
- [Business readiness and outstanding items](../commercial/READINESS.md): evaluates demonstrations, inquiries, estimates, delivery, support and updates; assigns unresolved launch decisions and evidence to owners.

No application/database behavior was changed for the commercial drafts. **No database migration.** Existing package/FAQ content and actual demo evidence were reused rather than publishing a new numeric price list.

## Verification

The bundled Artifact Tool authored, calculated and rendered the single-sheet XLSX. Independent expected values matched the first, middle and last packages. Checks changed effort, preserved a numeric zero price override, restored a blank override, rejected an invalid100%target margin and exposed a missing hourly rate as unavailable. Every temporary input was restored before export. Formula-error scan matched zero entries. The actual exported XLSX was reopened: formulas remained live and increasing E-commerce hours80→81 changed direct costRM4,380→RM4,430. Native Excel execution was **not run** because Excel is not installed. The final workbook preview was visually inspected for readable inputs/results and no clipped amounts.

Templates/packages/sales drafts were reviewed for working local links, coherent scope/revision/quotation references, actual product figures and legal/tax/claim boundaries. These are content checks, not invented automated business tests. No redundant application suite was added for reversible document creation. The final application evidence remains the [400 passing cases and affected rerun in M11](M11-REPORT.md); hosted/device checks stay explicitly unexecuted. Final content/link and diff results are recorded in the execution log.

## Manual review

Open the commercial pack and editable workbook locally. Review [draft website packages](http://127.0.0.1:3000/pricing), [portfolio](http://127.0.0.1:3000/portfolio) and [fictional inquiry workflow](http://127.0.0.1:3000/inquiry-workflow) after starting the ordinary local site.

1. Confirm the seven scopes/revision allowances match intended offers; approve or revise exclusions and delivery dependencies.
2. In the workbook, verify Landing Page direct cost **RM950.00**, proposed price **RM1,583.34** at40%target margin. Change development hours16→20: direct cost becomes **RM1,150.00**; restore16. Zero override must stay zero, with unavailable margin; clear it to restore calculated pricing.
3. Copy the eight templates for one fictional engagement. Fill client/project/revision IDs, measurable acceptance, schedule/dependencies, fee assumptions and responsibilities. Cross-check proposal→quotation→SOW→change→acceptance→handover references. Leave legal/tax/provider decisions unresolved until reviewed; do not issue/send drafts automatically.
4. Rehearse a product walkthrough using fictional data. Confirm each statement matches current functionality and that real payment, regulatory filing, live AI dispatch and customer communications are not implied.
5. Review the outstanding-items matrix and assign actual decision owners/dates before any public launch or first paid engagement.

## Limitations cost and Git

This pack prepares a studio foundation; it does not establish a registered business, a staffed SLA, production authentication, an external inquiry provider, hosted CI, off-device recovery or a live deployment. Founder product/content/commercial acceptance remains pending. Model pricing/entitlements and actual AI token costs are unmeasured. Final proposed selling prices require scoped effort/vendor validation and founder approval. General overhead and tax are excluded from the sample gross-margin model.

**Additional paid-service spend RM0.** Existing subscription usage is unknown; no credit purchase, paid API activation, cloud resource, domain, publication or external message was performed. Git remains uncommitted atop accepted M4 `1bc788e`, preserving unrelated user changes. No new acceptance tag, commit or push was made. Recommended next action: founder review of M5–M12 and the open items relevant to the chosen first engagement; public/production actions require separate authorization.
