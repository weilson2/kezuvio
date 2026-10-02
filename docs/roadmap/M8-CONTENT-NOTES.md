# M8 structured content notes

23 November 2026. This batch owns only `apps/website/lib/studio-content.ts` and this note. M7 has passed its current domain/database/browser checks according to integration-owner evidence; no founder acceptance is inferred. The updated user authorization permits continued local work through M12.

## Export contract

- `studioProducts: StudioProduct[]` — six current product presentations. Each has `slug`, `name`, `category`, `overview`, `features: string[]`, `audience: string[]`, `limitations: string[]`, `serviceSlug`, `screenshot`.
- `draftPackages: DraftPackage[]` — seven draft package scopes. Each has `id`, `name`, `scope: string[]`, `revisionAllowance: string`, `exclusions: string[]`, `deliveryAssumptions: string`, `options: string[]`, `priceLabel: string`.
- `studioFaqs: StudioFaq[]` — thirteen factual customer answers; each has `id`, `question`, `answer`.

The module is client-safe: no Node API, environment access, tracking, external fetch or action execution. Presentation owners can import it into server or client views. It does not mutate the existing shared `content.ts` service catalogue or any page.

## Boundaries and integration

Product screenshots point to `/demo-previews/<product-slug>.png`, using actual images captured by the integration owner. Verify those assets load in the fresh build; this content batch does not claim screenshot or browser verification. Service links use existing `web-development`, `pos-systems`, `custom-software` and the root-owned new `ai-automation` entry. Do not create a second service catalogue.

All package prices read **Draft — quotation after scope review**. Revision allowances are explicitly draft assumptions, not accepted commercial terms. Scope, assets/access, review coordination, exclusions and optional services remain subject to founder-approved proposals. No selling-price number, paid API, hosting purchase, domain, physical hardware or external delivery is activated by this content.

The six demonstrations are identified as fictional working workflows, with product-specific limits. Existing portfolio visual studies remain independent concepts. Copy claims no client track record, business registration, local office network, tax/payment certification, regulatory integration, guaranteed savings, rankings or AI recommendations.

Malaysia-oriented FAQ text names Kuala Lumpur and Johor Bahru as intended discussion markets without claiming offices or verified clients. It distinguishes remote requirements/review preparation from separately agreed on-site work, travel and support. The contact brief remains local to the device; content does not silently forward real contact details to the fictional Automation demo.

The thirteen FAQ topics cover website cost/scope, landing versus business sites, schedule dependencies, POS selection, custom CRM, supervised AI automation, e-commerce, maintenance, Malaysian service markets, search/AI discovery, honest demo provenance, inquiry handling and accounting integration limits. Answers describe the actual current demonstrations and proposed process, without presenting unverified market prices or external legal advice.

## Verification status

An actual Node import/assertion check passed: six unique complete product records, all six screenshot paths exist under the website public directory, seven packages carry the exact draft price label and no RM selling-price figure, and thirteen unique FAQ records contain questions/answers. Installed Prettier passed. This is content validation, not a browser/build pass.

This worker has not changed routes, CSS, metadata, service registration or analytics; M9 work remains separate. Full typecheck/browser/build/accessibility and the final M8 handoff belong to the integration owner and must record actual commands/results before REVIEW.
