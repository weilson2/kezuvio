# Kezuvio opportunity validation

Prepared 31 October 2026. This is a research plan and initial desk comparison, not completed customer validation. No merchant has been contacted through this task. All scores, conversion thresholds and prices below are hypotheses unless explicitly attributed.

## Decision and evidence register

Provisional first owned product: **Ledger Lite**. First reusable client offering to test: **Booking**. Interview evidence may overturn either choice. The strongest Ledger hypothesis is a quick daily cash record with understandable English/Chinese labels and a trustworthy way to keep and recover receipts; local language and MYR alone are not demonstrated differentiation.

| Required evidence | Current state | Owner / completion signal |
| --- | --- | --- |
| 15 merchant interviews | None documented in inspected files | Founder: dated, consented, anonymized evidence records |
| Clear top problem and target workflow | Hypothesis | Founder: repeated recent examples, frequency and consequence |
| 5 genuine beta commitments | None documented | Founder: named private contact, permission to follow up, device and agreed test window |
| 2 paying pilot commitments, ideally before cloud-heavy SaaS | None documented | Founder: written scope, price, decision-maker and acceptance; distinguish interest from signed commitment/payment |
| Two clickable prototype studies | Planned, not built/run | Product lead: task outcomes and observed failures |
| Activation and retention | Unmeasured | Product lead: predeclared definitions and cohort denominators |

## Opportunity scoring

Score each criterion 1–5 (5 is favorable). Weights: problem severity/frequency 25%, willingness to pay 20%, delivery speed 20%, differentiation/founder fit 15%, reuse for client work 10%, operational simplicity 10%. Total = sum(weight × score) / 5, out of 100. These are planning judgments from the supplied brief, not market measurements.

| Opportunity | Pain 25 | Pay 20 | Speed 20 | Fit 15 | Reuse 10 | Simplicity 10 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Ledger Lite | 3 | 2 | 5 | 3 | 4 | 4 | 68 |
| Booking | 3 | 3 | 3 | 3 | 5 | 3 | 64 |
| Retail Inventory | 3 | 3 | 3 | 2 | 4 | 3 | 59 |
| Restaurant Staff / QR Ordering | 4 | 3 | 1 | 4 | 4 | 1 | 58 |
| Generic AI consumer utility | 2 | 1 | 3 | 1 | 2 | 2 | 37 |

Ledger leads because a single-device product can test a narrow workflow cheaply. Booking has stronger reuse potential but needs durable server scheduling and tenant boundaries. Restaurant scores reflect stated founder familiarity, not verified sales expertise; printers, payments and sync add risk. Inventory needs reliable stock/audit rules. Generic AI has no identified distribution advantage.

Confidence is low for all commercial scores. Reducing Ledger's speed score from 5 to 4 gives 64, a tie with Booking. Raising Booking's evidenced willingness to pay from 3 to 4 gives 68. Small changes can reverse the ranking; do not treat a four-point lead as proof. Rescore with evidence IDs after interviews; record conflicting evidence rather than averaging it away.

## Initial alternatives comparison

Desk research checked 31 October 2026. Vendor documentation establishes advertised capabilities, not merchant satisfaction or hands-on performance. No current prices, Malaysian availability, language coverage or offline/restore behavior were verified.

| Alternative | Evidence / expected substitution | What to test with merchants |
| --- | --- | --- |
| Notebook, spreadsheet or chat messages | Candidate current workflows; prevalence unmeasured | Actual last-week process, forgotten records, reconciliation time and reasons it is good enough |
| Realbyte Money Manager | Official guide describes income/expense/transfer entry, filtering, periodic views and Excel export. [Home tab guide](https://help.realbyteapps.com/hc/en-us/articles/360046150874-Home-tab) | Does it already solve the job? Observe business/personal separation, language fit and export usefulness |
| Bookipi Expense | Official help directory includes category management and CSV reports. [Expense guides](https://bookipi.com/guides/bookipi-expense/) | Test receipt and recovery journeys, account requirements, export limits and switching barriers |
| Existing POS/accountant/accounting package | Candidate substitute for merchants already using one; no specific vendor claim | Is manual double-entry unacceptable? Are invoicing or statutory workflows essential? |
| Existing booking software or calendar | Candidate alternative for appointment-led businesses | Missed appointments, simultaneous booking, staff workload, current payments and tool costs |

After the interviews, test the two alternatives used most frequently by respondents on Android with synthetic data. Record version, locale, trial/paywall, steps to add an entry, refund, export and restore, source URL and date. Unknown cells stay unknown. Do not purchase, create accounts or upload merchant data under this milestone.

## Recruitment and study design

Recruit 15 distinct business operators initially: five food/home-food/stall operators, five small retailers or online sellers, and five appointment/service operators. These are sampling targets, not actual participants. Favor owner/operators who handle records themselves, use Android, and have recent transactions to discuss. Include at least three people who abandoned a previous tool and users who prefer different languages; avoid recruiting only friends who want to be encouraging.

Aim for a mix of paper and digital workflows and older/low-storage Android phones. Record where recruitment came from. Do not claim the sample represents all Malaysian SMEs. If a promising segment is too thin, recruit additional interviews rather than relaxing the 15-interview minimum or treating five mixed-segment responses as a market estimate.

Proposed cadence (elapsed days start when recruitment begins): days 1–2 recruit and pilot two interviews; days 3–7 complete 15 and tag evidence; days 8–10 synthesize and prepare two concepts; days 11–14 observe usability and secure explicit beta commitments. This is a planning target, not a promised calendar or authorization to message people.

## Interview guide (30–40 minutes)

Start: “We are researching how small businesses keep records and appointments. This is not a sales pitch. Please use sample or redacted information; we do not need customer identities or bank details. May I take notes? Recording is optional and requires separate permission.”

1. What kind of business do you run, who keeps records, and what language/device do you normally use?
2. Walk me through the last sale and business expense, from payment to record. Where did each record go? Ask to see a redacted example only if comfortable.
3. How did you work out last week's money received and money spent? What do you mean by “profit” in that process?
4. Tell me about the most recent missing receipt, mistaken amount or forgotten entry. When did it happen, how did you notice, and what did correcting it cost in time or money?
5. How do you record a customer refund, supplier refund, cash moved to a bank, or personal money put into the business? Look for semantics that invalidate our simple model.
6. What happens when there is no internet, the phone is shared, storage fills up, or the phone is lost? Have you actually restored a backup?
7. What have you tried already? What worked, what caused you to stop, and what do you pay now? Include accountant/service costs without requesting private documents.
8. Who needs the records next, in what format and how often? Is a spreadsheet sufficient, or are invoices, stock, multiple staff or regulated submissions essential?
9. For appointment businesses: walk through the last booking, change and cancellation. Describe the last conflict/no-show and what it cost. How is availability shared today?
10. Of the problems discussed, which would you fix first? What would you stop using if it were fixed? Ask what they would keep unchanged.
11. Only after learning the workflow, show the relevant concept. Ask “What do you think this does?” and “Where would it fail in your day?” Avoid pitching a feature list first.
12. Who decides to buy tools and how? What result would justify paying? Ask for a concrete next step and an agreed test week; distinguish polite interest from commitment.

Do not open with “Would you use our app?” or suggest the desired pain. Capture refusals, workarounds and “no problem” responses. Record costs/time as self-reported and do not extrapolate ROI.

## Evidence record template

Use one anonymized ID per merchant (e.g. `M001`, a template ID, not a claimed participant). Keep contact details in a separate private register, never the repository.

| Field | Record |
| --- | --- |
| ID / date / interviewer / recruitment channel | Pending |
| Segment / role / device / Android version / preferred language | Pending |
| Current workflow and tools / current cost | Pending |
| Last concrete incident / frequency / consequence | Pending |
| Verbatim redacted quote + permission | Pending |
| Must-have / dealbreaker / reason to stay with alternative | Pending |
| Observation vs inference / confidence / contradictory evidence | Pending |
| Prototype task results and assistance | Pending |
| Beta: declined / interested / explicitly committed | Pending |
| Pilot: discussed / scoped / signed / paid; evidence reference | Pending |
| Next agreed step and date | Pending |

For research privacy, ask for only contact method, business segment and testing needs. Proposed retention: delete recordings within 30 days of synthesis; review contact retention at 90 days and delete unless follow-up consent remains applicable. Honor withdrawal. Keep anonymized findings only when reidentification risk is addressed. These are proposed operational practices, not a legal compliance conclusion.

## Two prototype studies (future work)

**A — Ledger Lite:** language choice and local-data disclosure → record a sample RM18.50 expense → correct its category → inspect the monthly cash-flow summary → attach a fictional receipt → export → choose a backup → preview replace-only restore. Include offline, permission-denied, low-storage and corrupt-backup states. Label it a concept and do not store genuine records.

**B — Booking:** service/slot choice → booking confirmation → change/cancel; staff view → blackout period → two customers choosing the same slot → conflict response. Demonstrate expected server rejection as a concept, without implying the existing demo is production-ready. No live messages or payments.

Test with at least five relevant participants per concept; participants can overlap only when both workflows are relevant. Alternate presentation order when overlapping. Record unaided completion, time, errors, comprehension, trust concerns and preference relative to current tools. Prototype usability does not demonstrate actual offline persistence or transactional booking correctness.

Proposed usability gate: at least 4/5 participants complete the principal task unaided, correctly explain cash flow/booking state, and understand where data lives. Any misunderstood replacement restore or destructive action blocks beta until revised and retested. These are small-sample design gates, not population statistics.

## Go / revise / stop decisions

Specification gates: at least 15 interviews, a clear top problem and at least five genuine beta commitments. Before cloud-heavy SaaS, seek at least two paying pilot commitments; “ideally” is the brief's qualification, not a claim of mandatory revenue already earned.

Additional proposed decision rules:

- **Go to Ledger M1 review:** a coherent workflow cluster of at least five interviewees describes the same recent recurring recordkeeping pain, five suitable beta users explicitly commit, and the narrow offline scope can address the top problem. Include candidate IDs and negative evidence in the decision record.
- **Revise:** pain exists but language, cloud sharing, backup trust or switching costs invalidate the concept. Rework and retest before expanding architecture.
- **Stop/pivot:** most relevant users are adequately served, commitments do not materialize, or statutory accounting/bank sync is the primary job. Test Booking as the next hypothesis only if client evidence supports it.
- **Cloud/pilot gate:** document the feature that specifically needs a backend, who pays, cost ceiling, support workload and data responsibilities. A beta commitment alone is not a paying pilot.

Pricing research: first ask current expenditure and purchase authority without anchoring. Then test the brief's RM9.90–29.90/month range as an explicitly hypothetical offer, recording what value and payment model respondents expect. With a small cohort, price responses are qualitative. No subscription is implemented in v1. Custom client proposals need scoped discovery, milestone billing, change control and ongoing support costs rather than extrapolation from consumer pricing.

## Later beta measurement

Define activation as onboarding plus at least three genuine entries and viewing a correct summary within seven days. Define week-2 retention as recording on at least two days during days 8–14 among activated merchants whose workflow is at least weekly. Track the actual numerator/denominator and interview inactive users; do not count testers' synthetic tasks as product adoption.

Proposed early gate: at least 4/5 recruited beta merchants activate and 3/4 of those return in week 2, with zero unresolved data-loss defects. If denominators differ, report them explicitly rather than presenting a misleading rate. Use consented check-ins or participant-shared aggregate counts; automatic event collection is not required. Measure successful backup/restore separately. Only consider monetization after useful retention and demonstrated value; Play billing policy needs a fresh review then.

Product beta recruitment and Play eligibility are different tasks. Account type is unknown; qualifying personal accounts currently need at least 12 opted-in testers for 14 continuous days before applying for production access. Five product commitments cannot substitute for that cohort. [Official testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465).
