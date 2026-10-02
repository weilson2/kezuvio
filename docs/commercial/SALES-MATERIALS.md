# Sales materials — review drafts

23 November 2026 · **unsent, unpublished and subject to founder review**.

The six products below are working local demonstrations with fictional people, businesses, stock and transactions. They are not client case studies or production services. Screenshots come from the actual application. Review links use localhost; do not describe them as publicly available until a separately approved deployment is verified. No pricing, quotation delivery or customer-message campaign is activated by this file.

Claim sources: [studio content](../../apps/website/lib/studio-content.ts), [Cafe report](../six-products/M1-M2-REPORT.md), [Commerce report](../six-products/M3-REPORT.md), [Automation report](../six-products/M4-REPORT.md), [current Property review](../roadmap/M5-REVIEW-2026-11-23.md), [Accounting report](../roadmap/M6-REPORT.md) and [Interior report](../roadmap/M7-REPORT.md). Reports contain historical and current verification sections; use the latest execution/readiness record for release claims. These materials do not independently rerun those checks or establish founder acceptance.

## Demonstrator preparation

Use the current ordinary local build and running local PostgreSQL. Open a new product workspace or reset **only that fictional demo** before each script. Start with default prices, catalogue and data; later edits change the expected figures. Sessions last one hour. Explain the selectable roles as simulations. Do not enter real client details. The roughly two-minute pacing below is a rehearsal guide, not a measured completion guarantee; pre-open the page and familiarise yourself with controls.

Use a separate profile to show workspace independence if requested. Reset never supplies a production deletion tool or a promise of production-grade multi-tenant authentication. Keep public indexing, real provider activation and external communications outside this demonstration.

## Cafe POS & QR Ordering

**Portfolio description:** A fictional café workflow connects a table menu, stock reservation, kitchen progress, cashier settlement and a reconciled sales summary. The demonstration shows how the same order moves through several roles and how discounts, cash change, receipts and controlled refunds affect stock and totals. It is a starting point for discussing café rules and device requirements.

Audience: cafés, small restaurants and teams reviewing counter/ordering workflows. [Local review](http://127.0.0.1:3000/demo/cafe-pos?table=4) · [Actual capture](../../apps/website/public/demo-previews/cafe-pos.png) · [Evidence](../six-products/M1-M2-REPORT.md).

| Rehearsal time | On-screen action and narration                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:20      | Customer opens table 4. “This is a fictional table menu. A QR link identifies a table; it does not share a visitor's private workspace.”                                                 |
| 0:20–0:40      | Add **two Kopi susu · Iced**, place the order. “The order is **RM15.00**, and two sellable units are reserved.”                                                                          |
| 0:40–1:00      | Switch to Kitchen and advance the ticket through Preparing, Ready and Served. “The counter and kitchen follow the same saved order.”                                                     |
| 1:00–1:30      | Cashier opens a **RM100.00** shift, selects the order, applies **10%** discount and enters **RM20.00** cash. “Amount due is **RM13.50**, change **RM6.50**. This is a simulated tender.” |
| 1:30–1:50      | Show receipt and Manager stock/report. “Iced coffee stock is **18**, reserved quantity **0**, and net sales **RM13.50** after this one sale. Reprinting does not create a second sale.”  |
| 1:50–2:00      | “A real installation needs agreed staff access, hardware, connectivity and payment-provider testing.” Invite the viewer to describe one actual ordering exception.                       |

Boundaries to retain in any caption: no live acquiring, physical printer, ingredient recipes, offline guarantee or multi-branch sync. The localhost QR cannot make a phone join this desktop workspace. Service starting point: [Custom POS](SERVICE-PACKAGES.md#custom-pos--custom-pos).

## Commerce Studio

**Portfolio description:** A fictional shop demonstrates catalogue search, persisted carts, coupon arithmetic, simulated checkout and a seller's fulfilment/refund workflow. Accepted orders retain their saved names and prices, while stock and sales summaries follow the same transaction records. This makes checkout exceptions and fulfilment policy concrete during discovery.

Audience: small retailers and teams planning an online shop. [Local review](http://127.0.0.1:3000/demo/commerce-studio) · [Actual capture](../../apps/website/public/demo-previews/commerce-studio.png) · [Evidence](../six-products/M3-REPORT.md).

| Rehearsal time | On-screen action and narration                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:25      | Customer finds **Everyday notebook** and adds two. “A cart is saved in this visitor workspace; adding it does not reserve stock.”                                                                       |
| 0:25–0:45      | Apply **EVOLVE10**. “Subtotal **RM36.00**, discount **RM3.60**, payable **RM32.40**. No tax or shipping calculation is being claimed.”                                                                  |
| 0:45–1:05      | Complete one simulated checkout and show My orders. “One order is saved; notebook stock moves from **24 to 22**.” If rehearsing a decline separately, it must preserve the cart and stock before retry. |
| 1:05–1:30      | Manager packs, ships and marks that order delivered. Show gross **RM36.00**, discount **RM3.60**, net **RM32.40**. “Fulfilment is an explicit recorded sequence.”                                       |
| 1:30–1:50      | Refund the delivered order without restocking. “Net returns to **RM0.00**, stock stays **22**. The demo does not restock shipped or delivered goods.”                                                   |
| 1:50–2:00      | “Real customer accounts, delivery rules, returns and chosen providers need their own scope.” Ask which exception the retailer needs most.                                                               |

Boundaries: fictional payments/catalogue, no bank/courier/marketplace connection or regulatory certification. Production shipping, returns, customer data and provider charges are separate decisions. Service starting point: [E-commerce Website](SERVICE-PACKAGES.md#e-commerce-website--e-commerce-website).

## AI Automation Hub

**Portfolio description:** A supervised inquiry workflow turns fictional briefs into explainable requirements and an editable MYR quotation draft. Versioned local rules show why suggestions appeared; tasks, retries and current-revision approval remain visible. The demo explores automation with human review without activating a paid model API or sending a proposal.

Audience: service businesses and teams reviewing repeatable inquiry/quotation processes. [Local review](http://127.0.0.1:3000/demo/automation-hub) · [Related inquiry workflow](http://127.0.0.1:3000/inquiry-workflow) · [Actual capture](../../apps/website/public/demo-previews/automation-hub.png) · [Evidence](../six-products/M4-REPORT.md) and [current quotation fixture](../roadmap/M9-REPORT.md).

| Rehearsal time | On-screen action and narration                                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0:00–0:25      | Customer submits a fictional `.test` address and the exact brief **“A fictional website with an online booking workflow.”** Complete required sample budget/timeline fields. “This is sample discovery data.”                                    |
| 0:25–0:50      | Manager starts and completes its queued analysis. Show the matched discovery, website, booking and automation requirements. “The word ‘workflow’ also matches the automation rule. These are deterministic rules, not a live AI-model response.” |
| 0:50–1:10      | Show the default **RM4,800.00** draft. “These rates are illustrative. This is neither an approved Kezuvio selling price nor a client offer.”                                                                                                     |
| 1:10–1:30      | Apply a **10%** whole-quote discount and save: **RM4,320.00**. Show human review and approve that revision. “Approval refers to this specific saved revision.”                                                                                   |
| 1:30–1:50      | Edit the quote again and show it returning to Draft. “Earlier approval cannot authorise changed output. Follow-ups stay internal, and readiness tasks do not send messages.”                                                                     |
| 1:50–2:00      | Ask the viewer to name the input, output and action that must always need a person. “Any real connector or paid model needs separate evaluation, limits and approval.”                                                                           |

Boundaries: no paid model API, autonomous employee, outgoing email/WhatsApp, production command dispatcher or guaranteed accuracy/savings. Demo Manager approval is a simulation, not a real commercial signature. Service starting point: [AI Automation](SERVICE-PACKAGES.md#ai-automation--ai-automation).

## Property CRM

**Portfolio description:** Fictional Malaysian listings, contacts and agents support a saved lead journey from inquiry through assignment, viewings and a recorded outcome. Keyboard stage controls enforce prerequisites, appointment conflicts preserve the prior booking, and the overview separates distinct listing asking value from closed-lead conversion. Archive/restore preserves historical links.

Audience: property sales teams and small teams coordinating opportunities/appointments. [Local review](http://127.0.0.1:3000/demo/property-crm) · [Actual capture](../../apps/website/public/demo-previews/property-crm.png) · [Current evidence](../roadmap/M5-REVIEW-2026-11-23.md).

| Rehearsal time | On-screen action and narration                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:25      | Customer searches the available catalogue, then Manager opens Overview. “Fresh data has **8 open leads**, **1 Won**, **1 Lost** and **50.0%** closed-lead conversion.”                   |
| 0:25–0:45      | Show **RM3,183,000.00** asking value. “This counts each available listing linked to open leads once. It is asking value, not revenue or forecast commission.”                            |
| 0:45–1:05      | Open Pipeline and select **Hafiz Rahman**, seeded in Viewing. Show the completed viewing. “Offer and Won require a completed viewing for the current agent and listing.”                 |
| 1:05–1:30      | Move Hafiz to Offer, then Won using the keyboard Move to stage control. “This seeded lead has no outstanding scheduled viewing or pending reminder to resolve.”                          |
| 1:30–1:50      | Overview now shows **7 open leads**, **2 Won**, **1 Lost**, conversion **66.7%**. Show the recorded subject in Activity. “Only current non-archived closed leads form that denominator.” |
| 1:50–2:00      | “Viewings display Malaysia time; reminders do not send messages.” Ask which assignment or booking rule the team needs.                                                                   |

An extended review fixture in the current report reduces the open pipeline to three leads on RM450,000/RM600,000 listings: **RM1,050,000 and 50.0%**. Do not claim this is the default eight-lead overview. Boundaries: fictional listings/agents/prices, no listing feed, calendar sync, messaging or real employee authentication. Service starting point: [CRM](SERVICE-PACKAGES.md#crm--crm).

## Accounting Cloud

**Portfolio description:** A fictional SME's accrual workflow links invoices, partial settlements, unpaid credits and controlled reversals to immutable balanced journals. Ledger, trial balance, P&L, balance sheet and dated AR/AP reports derive from those postings. Manual bank matching and a bounded moving weighted-average stock example make reconciliation visible.

Audience: SMEs defining reporting needs with their accounting adviser. [Local review](http://127.0.0.1:3000/demo/accounting-cloud) · [Actual capture](../../apps/website/public/demo-previews/accounting-cloud.png) · [Numeric evidence and policy](../roadmap/M6-REPORT.md).

| Rehearsal time | On-screen action and narration                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0:00–0:25      | Manager opens fresh Reports: cash **RM10,149.97**, AR **RM1,250.00**, AP **RM500.00**, profit **RM1,099.99**, balance difference **RM0.00**. “These are fictional journal-derived balances.”                 |
| 0:25–0:50      | Post an additional **RM200.00** customer invoice today with an agreed sample due date. “AR and income increase RM200; cash stays fixed.”                                                                     |
| 0:50–1:15      | Record **RM100.00** receipt, then **RM40.00** unpaid credit against that invoice. “The document now has **RM60.00** outstanding. Cash rises RM100; the net income increase is RM160.”                        |
| 1:15–1:40      | Show linked journal lines and reports: balance difference remains zero. “Posted journals are immutable; corrections append a controlled reversal. A dated report reconstructs the balances at its end date.” |
| 1:40–2:00      | “The demonstration includes manual bank matching and moving weighted-average inventory. It does not file tax or send official e-Invoices.” Ask the adviser which closing and reconciliation examples matter. |

Optional extended fixture, from reset: buy one chair at **RM100.02**, then sell one at **RM200.00**; issue cost **RM100.01**, stock **2 units/RM200.03**, bank change **+RM99.98**, profit **+RM99.99**. This is a worked demo policy, not a supplier quote. No production accounting service, professional advice, LHDN/MyInvois/SST certification, tax calculation/filing, bank feed or cash-credit refund claim. Custom software/accounting discovery requires qualified review.

## Interior 3D Studio

**Portfolio description:** An interactive room combines original primitive furniture, surface/finish previews, dimension controls, validated placement and a transparent illustrative estimate. Visitors save, load and duplicate layouts and export a screenshot where browser WebGL is available. Numeric controls provide a keyboard alternative to scene interaction.

Audience: interior/furniture businesses exploring an options configurator. [Local review](http://127.0.0.1:3000/demo/interior-3d) · [Actual capture](../../apps/website/public/demo-previews/interior-3d.png) · [Evidence and pricing policy](../roadmap/M7-REPORT.md).

| Rehearsal time | On-screen action and narration                                                                                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:25      | Open **Fictional studio lounge**, **500 × 400 × 280 cm**. Orbit and zoom. “These eight catalogue models use original primitive geometry.”                                                                                                     |
| 0:25–0:45      | Show default sofa, coffee table and lamp: furniture **RM2,430.00**, floor **RM1,300.00**, walls **RM378.00**, total **RM4,108.00**. “All rates are illustrative; surface costs use gross areas.”                                              |
| 0:45–1:10      | Select the sofa; use quarter-turn rotation or numeric position controls. Preview an outside-room/overlapping placement and show rejection preserves its saved position. “Touching edges are allowed; footprints must remain inside the room.” |
| 1:10–1:30      | Change the lamp finish to Walnut: **RM198.00** instead of RM180.00. With no other saved price/size/surface changes, total becomes **RM4,126.00**.                                                                                             |
| 1:30–1:50      | Save/rename and duplicate the design; edit the duplicate and return to the original. Show screenshot export if WebGL is supported. “Current demo rates recalculate saved layouts; this is not a frozen quotation.”                            |
| 1:50–2:00      | “This is not CAD, structural advice or a real measurement/quotation tool. Browser/device performance varies.” Ask what configuration decisions a customer needs to compare.                                                                   |

Boundaries: whole-centimetre dimensions, quarter-turns, rectangular floor collisions, no supplier feed or physical simulation. WebGL/image export can be unsupported; the fallback retains numeric editing. Custom configurator discovery must define assets, geometry, pricing ownership and device targets.

## Service comparison for discovery

All fee fields remain **quotation after scope review**; options and recurring/provider costs are separately identified in [service packages](SERVICE-PACKAGES.md).

| Starting package    | Best initial question                              | Typical deliverable boundary                        | Review allowance                       | Major decision before estimating                                |
| ------------------- | -------------------------------------------------- | --------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| Landing Page        | What is the one visitor action?                    | One agreed page and CTA journey                     | Two consolidated rounds                | Content/offer/language readiness                                |
| Business Website    | Which information/pages support the business?      | Agreed page inventory and editing/handover approach | Two consolidated rounds                | Page count, content and CMS needs                               |
| E-commerce Website  | Who owns catalogue, stock and fulfilment?          | Catalogue/cart/order and scoped seller workflow     | Two consolidated rounds                | Payment/shipping/returns and provider approvals                 |
| Custom POS          | How do order, stock, tender and refunds reconcile? | Agreed sales/staff/receipt/shift rules              | Two consolidated workflow rounds       | Hardware, connectivity, offline/branch requirements             |
| CRM                 | Which stages and assignments need enforcement?     | Agreed contact/lead/follow-up/report model          | Two consolidated workflow rounds       | Roles, data migration, calendar/message scope                   |
| AI Automation       | What may execute, and who reviews output?          | One bounded process and evaluation set              | Two consolidated process rounds        | Permitted actions, providers and human gates                    |
| Website Maintenance | Who owns updates, backups and response?            | Defined supported assets and request allowance      | One review per included content change | Inherited state, hours, recovery ownership and recurring budget |

Accounting and 3D are custom-software scopes; they are not silently included in CRM, POS or a basic website fee. Compare a suitable existing product with custom development before assuming a build is necessary.

## Website copy drafts

**Homepage hero:** “Software workflows you can explore.” Supporting copy: “Kezuvio Labs brings websites, ordering, commerce, CRM and supervised automation ideas into working demonstrations. Explore six fictional products, then shape a project around your actual users, decisions and acceptance criteria.” CTAs: **Explore demonstrations** → `/demo`; **Prepare a project brief** → `/request-quotation`.

**Portfolio introduction:** “Six original demonstrations. Each shows a saved workflow, visible rules and explicit limits. They are fictional studies, with no client results or production deployment claimed.” Card CTA: **Review demo**. After public deployment approval, replace only with a verified accessible link; do not imply a localhost link works for a remote visitor.

**Services introduction:** “Start with the job your software must help someone finish. Agree the pages or workflow, review the exceptions, and define how to verify the result. Package outlines guide discovery; a written scope and reviewed quotation set the commitment.”

**Malaysia service-area copy:** “The intended service market includes Malaysian SMEs, including teams in Kuala Lumpur and Johor Bahru. Requirements and demonstrations can support remote discussion; on-site work, travel and support arrangements need agreement.” This does not claim staffed offices or existing local clients.

**Pricing introduction:** “Draft packages, scoped before price. Page count, content, data, integrations, devices and ongoing support affect the estimate. Development, provider charges and maintenance are shown separately. No package price is final until the founder approves the quotation.”

**Inquiry microcopy:** “Prepare a project brief on your device. The current form does not send it to Kezuvio or save those contact details to a server. Copy or download it, then use only an approved communication arrangement. Use fictional details in the interactive demos.” Do not relabel this as a submitted lead.

**Support copy:** “Maintenance should identify supported assets, update and restore responsibilities, request limits and service hours. An acknowledgement target is different from a recovery promise.” Avoid uptime, 24/7 or resolution guarantees until separately agreed and supported.

## Four-week social draft plan

Twelve draft posts, three per week, for founder review. No scheduling, platform login or publication has occurred. Use actual captures linked above; remove any workspace secrets and keep **Fictional local demo** visible in visuals/captions. Refresh outdated captures if the UI changes. A CTA to contact or a live link remains pending an approved public destination and data-handling arrangement. Until then, use these as private discussion drafts.

| Week / post | Editable caption draft                                                                                                                                                                                                                                               | Visual / accessible description                                                         | Review CTA                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1 / 1       | “What happens after someone places an order? This fictional café demo follows one order from table to kitchen and counter. Two iced coffees, a 10% discount and a cash tender produce RM13.50 due and RM6.50 change. Payments and printing are simulated.”           | Cafe capture; alt: fictional table order and counter totals                             | “Which ordering exception would you test?”      |
| 1 / 2       | “A catalogue is only part of an online shop. Commerce Studio connects a saved cart, stock and fulfilment. Two sample notebooks total RM32.40 with the demo coupon. No bank or courier is connected.”                                                                 | Commerce capture; alt: sample notebook catalogue and saved basket                       | “Describe your fulfilment process.”             |
| 1 / 3       | “One focused campaign may need one strong page; several services may need a structured site. Start with the visitor's action and the content that supports it. Our package outlines are draft scopes, with fees reviewed after discovery.”                           | Founder-reviewed comparison text card; no unbuilt UI screenshot                         | “Draft your primary visitor action.”            |
| 2 / 1       | “Automation needs a review point. This local rules demo turns a fictional inquiry into explainable requirements and an unsent quote. Changing the quotation revision requires review again. No paid AI API or customer message is activated.”                        | Automation capture; alt: draft quotation and revision review                            | “Which output must a person approve?”           |
| 2 / 2       | “A pipeline total needs a definition. Property CRM counts each available listing once across open leads. Asking value is not revenue. Fictional records make it possible to test stages, assignments and booking conflicts without using client data.”               | Property overview; alt: fictional asking value and stage counts                         | “What should your CRM count?”                   |
| 2 / 3       | “A useful project brief names the user, the task, the exception and the expected result. Page count, data and integrations affect the estimate. The current brief tool prepares a device-local file; it does not submit a lead.”                                     | Actual quotation page capture if reviewed, otherwise a plain text prompt card           | “Write one acceptance example.”                 |
| 3 / 1       | “An invoice and a receipt are different accounting events. Accounting Cloud demonstrates balanced journals, partial settlements and report reconciliation with fictional MYR data. It is not a production accounting service or official tax/e-Invoice integration.” | Accounting capture; alt: fictional journal-derived reports with zero balance difference | “Review your required reports with an adviser.” |
| 3 / 2       | “Explore a room before discussing a configurator scope. This original primitive scene combines furniture, surfaces, numeric placement and illustrative costs. The seed layout totals RM4,108. Browser WebGL support varies; it is not CAD or a real quotation.”      | Interior capture; alt: fictional room with sofa, table and lamp                         | “Which room options matter to your customer?”   |
| 3 / 3       | “A demo makes rules visible; a production project needs its own access model, provider tests, data handling and support owner. Selectable demo roles are not employee authentication. We keep those decisions explicit in the scope.”                                | Annotated demo-role capture, clearly fictional                                          | “List the roles your team needs.”               |
| 4 / 1       | “Maintenance is a defined service, not unlimited new development. Agree supported versions, content allowance, update checks, backups, restore rehearsal and service hours. Hosting and provider fees should stay visible separately.”                               | Plain text responsibility card                                                          | “Who owns restore testing today?”               |
| 4 / 2       | “For Malaysian SMEs, useful software starts with the actual process. Remote requirements and demo reviews can support teams in Kuala Lumpur and Johor Bahru; on-site arrangements need agreement. No local office network or client outcome is claimed.”             | Approved brand asset with intended-service-area wording                                 | “Prepare a fictional process example.”          |
| 4 / 3       | “Six original fictional demonstrations: café ordering, commerce, supervised automation, property CRM, accounting logic and room configuration. Each has explicit limits. Use them to ask better questions before agreeing a build, price and acceptance criteria.”   | Six actual product captures; alt describes six labelled demo tiles                      | “Choose one workflow for a private review.”     |

## Customer FAQ drafts

**How much will my website or system cost?** Scope, content, data, devices, integrations and support determine the estimate. The seven package outlines have no approved public selling price. A reviewed quotation separates one-time work, optional items, recurring services and provider charges.

**How long does delivery take?** Dates depend on the agreed deliverables, content/access readiness, technical feasibility and consolidated review. A proposal states those dependencies and a milestone schedule; these materials promise no fixed duration.

**Can I buy the demonstration as a finished production system?** Treat it as a working prototype of a bounded workflow. Production authentication, data handling, hardware/providers, deployment and support need a separate scope and verification. No live subscription is offered by these drafts.

**Are the portfolio examples client projects?** No. They are original demonstrations using fictional records. There are no invented testimonials, client results, offices or ROI claims.

**Are payments, messages or paid AI services active?** Demo payments are simulated. Automation uses deterministic local rules. The demos do not send customer messages or call paid model APIs. A real integration needs named approval, scope, provider access, evaluation and cost limits.

**What is included in a review round?** One consolidated decision list against the agreed design/workflow. The usual draft allowance is two rounds; maintenance allows one review per included content change. New scope uses a change request; failures against agreed criteria are assessed as defects.

**Can existing data be imported?** Only under a reviewed migration scope covering ownership, secure transfer, mapping, duplicates, retention, reconciliation and rollback. Start discovery with fictional examples rather than uploading production records to a demo.

**Can the POS work with our printer or without internet?** Hardware compatibility, offline operation and branch synchronisation are not established by browser receipt/stock demos. Identify exact devices and connectivity needs, then include a feasibility test and explicit scope if required.

**Does Accounting Cloud file tax or integrate with MyInvois?** No. It demonstrates journal/report logic, not professional accounting advice, official e-Invoicing, tax filing or LHDN/MyInvois/SST certification. Real accounting use requires separate qualified review and project scope.

**Are 3D costs and dimensions real quotations or CAD measurements?** No. Prices and surface rates are illustrative. Whole-centimetre controls, quarter-turns and rectangular collisions are bounded demo choices. Supplier, measurement and CAD requirements need separate design.

**What happens to a contact brief or analytics event?** The current contact form prepares a copy/download on the device and does not submit those contact details to a server. Loopback development analytics stores bounded event names, allowed paths and timestamps locally without transmitting events; it is not production tracking or a consent system.

**Do you guarantee SEO ranking, AI recommendations or business savings?** No. Clear content, metadata, accessible navigation and measured performance can be part of an agreed scope. Rankings, AI inclusion, traffic, sales, savings and model accuracy are not guaranteed.

**Is support included forever?** No. Handover and any maintenance coverage are specified separately, including supported assets, allowance, service hours and ownership. Acknowledging an issue does not promise a fixed recovery time.

**Who owns the source and how are legal or tax terms handled?** Ownership, licences, payment, liability, privacy, cancellation and tax terms must be made explicit in the client documents and reviewed by appropriate Malaysian professionals before use. No default legal transfer or tax rate is asserted here.

**Can you work with businesses in Kuala Lumpur or Johor Bahru?** They are intended service markets. Remote discovery/demo arrangements, on-site work, travel and support coverage must be agreed. These drafts do not establish an office presence or existing delivery in either city.

## Approval record before external use

Copy/material revision: `{{revision}}`; founder claim/price review: `{{name/date}}`; screenshot/data check: `{{name/date}}`; approved destination/link: `{{URL or private channel}}`; privacy/communication arrangement: `{{reference}}`; legal/accounting review where relevant: `{{reference or pending}}`; explicit publication or sending approval: `{{named action/date or not authorised}}`.

No approval fields are completed by this draft. Use the [client document templates](client-templates/CLIENT-QUESTIONNAIRE.md) to turn a discussion into a scoped reviewable proposal.
