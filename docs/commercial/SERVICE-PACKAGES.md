# Draft service packages

23 November 2026 · founder review draft · **no selling prices finalised or published**.

These seven packages mirror the [website package source](../../apps/website/lib/studio-content.ts). They are starting points for discovery, not fixed-price offers or a promise that a demonstration can be deployed unchanged. Page counts, data volumes, devices, integrations, dates and fees are defined in a project-specific SOW and quotation. No purchase, provider activation, customer communication or public release is authorised by these drafts.

## How to prepare an offer

Complete the [questionnaire](client-templates/CLIENT-QUESTIONNAIRE.md), choose the primary package, and create a linked [proposal](client-templates/PROJECT-PROPOSAL.md), [quotation](client-templates/QUOTATION.md) and [SOW](client-templates/SCOPE-OF-WORK.md). Record one decision maker, the required inputs, measurable acceptance and exclusions. Price options separately; an option is outside the included total until selected. Keep development fees separate from hosting, domains, hardware, subscriptions, API use and ongoing support.

**Price label for every package: Draft — quotation after scope review.** Populate fees only from a founder-approved estimate. No delivery duration is committed here. The estimate starts from agreed scope, supplied content/access, feedback availability and actual integration feasibility.

Unless specified below, the draft allowance is **two consolidated review rounds** on the agreed design or workflow. A round is one coordinated decision list against the agreed artefact; new scope or extra rounds require a reviewed [change request](client-templates/CHANGE-REQUEST.md). Failures against agreed acceptance criteria are defects, assessed separately from additional features. Legal, tax, privacy, IP, liability and cancellation terms require Malaysian professional review before commercial use.

## Landing Page — `landing-page`

**Intended use:** one focused offer or campaign with a clear visitor action.

Included starting scope: one agreed page, responsive layout, accessible contact calls to action, approved text/image placement, page title/description and social preview. Define sections, language, form behaviour and the primary CTA before estimating.

Review: two consolidated design/content-placement rounds. Client inputs: approved outline, brand assets with rights, final text/images and one feedback coordinator. Delivery assumes those inputs are ready; publishing needs named approval.

Excluded: brand strategy, custom photography, extensive copywriting, checkout, customer accounts, business-system integration, domain, hosting and third-party subscriptions. Optional: another language, copywriting workshop, another campaign page.

Acceptance example to tailor: the visitor understands `{{offer}}`, can navigate by keyboard at the agreed mobile/desktop sizes, and completes `{{approved CTA}}` with the agreed confirmation. Device-local brief preparation and a real message delivery form are different scopes.

## Business Website — `business-website`

**Intended use:** a company with several services, information pages or a growing content library.

Included starting scope: an agreed page inventory, reusable responsive components, contact inquiry journey, basic search metadata, and a discovery decision on editing/handover. Specify page count, languages, editing roles and initial content entry explicitly.

Review: two consolidated design/workflow rounds. Client supplies approved content, page owners, brand rights and required access. Schedule depends on content readiness and CMS/editing decisions.

Excluded: unlimited pages/content entry, custom CRM, checkout, undocumented integrations and guaranteed search/AI rankings. Provider charges are itemised separately. Optional: CMS integration, additional service pages, maintenance/content support.

Acceptance example: every listed page/CTA works, agreed metadata is present, supported keyboard/mobile journeys pass, and the receiving owner completes the agreed content-update or handover task. Search visibility is not guaranteed.

## E-commerce Website — `e-commerce-website`

**Intended use:** a retailer defining a catalogue, cart and fulfilment process.

Included starting scope: agreed products/categories, cart/checkout/order-status journeys, seller fulfilment and scoped stock requirements, plus payment/shipping feasibility review. Confirm quantity of catalogue entry, stock ownership, customer access, delivery/returns policy and currency/rounding rules.

Review: two consolidated workflow rounds. Schedule requires clean product inputs and chosen providers; approval/testing precedes real payments. The [Commerce demonstration](SALES-MATERIALS.md#commerce-studio) uses fictional payments and does not supply provider approval.

Excluded: acquiring/transaction fees, courier contracts, marketplace migration, unlimited catalogue entry and tax/regulatory certification. Optional: reviewed catalogue import, approved courier integration, customer accounts/order history.

Acceptance example: an agreed basket reconciles price/discount/stock, a duplicate checkout produces one order, a rejected payment preserves the agreed recoverable state, and a seller completes the contracted fulfilment/refund rules. Test provider sandboxes separately if included.

## Custom POS — `custom-pos`

**Intended use:** a café or retailer with specific sales, stock and staff workflows.

Included starting scope: agreed sales/catalogue/staff journeys, inventory/report rules, receipt and shift requirements, and optional definition of café table/QR/kitchen workflows. Define staff authentication, refund authority, stock reservations, connectivity and reconciliation fixtures before estimating.

Review: two consolidated workflow rounds using approved scenarios. Hardware or business-rule changes require a change request. Actual device compatibility needs the named printer/scanner/terminal and a real test; a browser receipt is not hardware integration.

Excluded: terminals/printers/scanners/network equipment, acquiring, offline operation and multi-branch synchronisation unless explicitly specified; no fiscal, tax or payment certification. Optional: QR ordering, printer/scanner feasibility prototype, additional branch/stock workflows.

Acceptance example: order → preparation → settlement produces the expected sen totals, receipt and stock movement once; rejected/refunded transactions reconcile under the agreed policy. See [Cafe walkthrough](SALES-MATERIALS.md#cafe-pos--qr-ordering) for a fictional example only.

## CRM — `crm`

**Intended use:** a team whose lead stages, assignments and reporting need a defined workflow.

Included starting scope: agreed contact/lead model, assignment/stages/follow-ups, roles/reporting requirements and a reviewed import/retention approach. Define history retention, ownership, stage gates and whether appointments or customer messaging are included.

Review: two consolidated workflow rounds against agreed lead journeys. New entities or stage rules require a change request. The client supplies a process owner, fictional examples, permission matrix and reporting outcomes; real data transfer needs an approved handling plan.

Excluded: unreviewed migration, bulk messaging, external calendar sync, lead-provider subscriptions, unlimited reports and agency-specific compliance guarantees. Optional: reviewed data import, approved calendar integration, custom dashboards/exports.

Acceptance example: an authorised user advances a lead under the agreed prerequisites; a forbidden transition or booking conflict leaves prior records intact; reports count unique opportunities/listings according to written definitions. [Property CRM](SALES-MATERIALS.md#property-crm) illustrates one workflow.

## AI Automation — `ai-automation`

**Intended use:** one repeatable process with clear human review and permitted actions.

Included starting scope: one agreed process, input validation, explainable decision/output rules, approval checkpoints, bounded execution/retries/history and evaluation on fictional cases. Document prohibited actions, escalation, timeout/attempt caps and acceptable outputs before implementation.

Review: two consolidated process rounds against the agreed evaluation set. Extra tools, providers or autonomous actions require separate review. Process owners supply representative cases and an accountable reviewer. Any paid API or external service needs explicit activation and a usage cap.

Excluded: paid model APIs/subscriptions, unsupervised customer communications or production commands, guaranteed model accuracy, savings or business results. Optional: approved document/CRM connector, extra evaluation cases, usage monitoring and ongoing review.

Acceptance example: a known input creates a traceable draft; changing its revision invalidates earlier approval; duplicate delivery does not duplicate consequential effects; an unapproved action cannot execute. [Automation Hub](SALES-MATERIALS.md#ai-automation-hub) uses deterministic local rules, not a paid live model.

## Website Maintenance — `website-maintenance`

**Intended use:** an agreed supported site/environment after ownership and inherited condition are reviewed.

Included starting scope: a defined update/dependency-review cadence, backup/recovery checks, small content-change allowance and documented issue intake/handover. Set request/hour limits, supported hours, acknowledgement expectations, carry-over policy and backup/restore owner in the [maintenance agreement](client-templates/MAINTENANCE-AGREEMENT.md).

Review: **one consolidated review for each included content change**. Service begins only after source/hosting access, ownership, backup responsibilities and inherited faults are assessed. Response is distinct from resolution; no recovery commitment is implied without a tested and agreed target.

Excluded: unlimited development, major redesign/new integrations, round-the-clock support or guaranteed recovery unless contracted, hosting, renewals and provider charges. Optional: extra content changes, extended support, periodic accessibility/performance review.

Acceptance example: the agreed update/change is tested before approved release, its result is documented, backup evidence is recorded, and an isolated restore rehearsal demonstrates the agreed scope. Configuration alone is not proof of a successful backup.

## Founder decisions before commercial use

Record approved fee, cost assumptions and contingency per package; service/entity details; professional review references; support capacity; approved client communication/privacy arrangements; and the release authority. Accounting/reporting and 3D configurators remain custom-software discovery scopes rather than unpriced additions to a package. Templates do not establish an SLA, a production security guarantee or a regulatory certification.
