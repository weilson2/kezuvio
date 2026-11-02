# Phase 0 — discovery and implementation plan

Historical discovery record, 30 October 2026. Initial scope: Phase 0 and Milestone 1 only; the user then authorized Milestone 2. On 31 October the user explicitly authorized all remaining tasks and a report. All local milestones are now delivered; see `final-delivery-report.md` and `deployment-guide.md` for the current architecture, results and remaining launch requirements. The initial findings below are retained as project history.

## Repository findings

The initial workspace contains only the supplied master specification and brand reference PDF in `.codex-attachments/`. There is no application, package manifest, installed project dependency, configuration, Git repository or existing feature to preserve. No AGENTS.md was found. Node 24.21.0 and npm 11.19.0 are available. The provided PDF has ten landscape pages, 960 × 540 pt; all ten were rendered and reviewed as a contact sheet.

The reference establishes a dark navy foundation, indigo/purple/cyan accents, generous sans-serif typography and an angular K. Retain that visual direction, but draw new vector geometry and build editable components. Do not reuse its embedded mockups, illustrative metrics, contact details or screenshots as business evidence.

## Milestone plan and acceptance criteria

1. **Brand foundation (this delivery):** original geometric K; horizontal, stacked and icon lockups in light-background, dark-background and monochrome treatments; favicon and app icons; self-hosted Inter with license; light/dark semantic tokens; responsive shared components; a local brand workbench; usage documentation. Accept when assets regenerate, TypeScript/build pass, both themes and essential interactions are checked, and specified viewport widths have no page overflow.
2. **Company website (subsequently authorized):** Next.js public routes, honest service and concept content, configurable contact handling, metadata and accessibility. Accept the local preview when each advertised route and action works and delivery is honestly represented; live enquiry delivery remains a launch requirement.
3. **Demo portal shell:** isolated sample-data and reset contracts, demo cards and routing; no empty Try Demo promises.
4. **First demos:** business website, QR ordering and booking, with tested state transitions and session isolation.
5. **Advanced demos:** POS, commerce and SME management with reconciled RM totals and simulated payments.
6. **Marketing and PDF:** editable templates and twelve newly composed, selectable-text presentation pages; inspect every export page.
7. **Deployment and QA:** infrastructure choice, costs, security review, CI and production checks. Public deployment requires explicit authorization.

## Architecture

Use one Next.js App Router application, with shared source packages and npm workspaces reserved for future package boundaries. `packages/brand` is framework-independent (tokens, CSS and asset generator inputs). `packages/ui` exports typed React primitives without routing or backend dependencies. The original plan was a small Vite workbench; after the website phase was authorized, `/brand` became the workbench route inside `apps/website` to avoid a second application. Next.js serves pre-rendered website pages. There is no database or submission backend at this stage.

```
apps/website/            company website and /brand review surface
packages/brand/          tokens and global styles
packages/ui/             React components and component styles
assets/logos/            generated, outlined SVG lockups
assets/icons/            SVG/PNG/ICO application assets
assets/fonts/            self-hosted Inter and OFL license
docs/                   discovery, brand guidelines, verification
scripts/                deterministic asset generation and checks
tests/                  responsive, accessibility and interaction checks
```

## Implementation sequence

Write this plan → establish workspace and tokens → generate geometric artwork and icons → implement shared components → compose brand workbench → implement the subsequently authorized website routes → run build, contrast, browser and visual checks → document results and stop before Milestone 3.

## Assumptions and risks

- Kezuvio Labs is a proposed Malaysian studio. No registration, trademark clearance, client history or performance claims are asserted.
- English is the initial brand workbench language. Inter covers Latin; later Chinese templates need an appropriately licensed CJK companion and glyph/layout validation.
- Keep the supplied palette as brand swatches. Use darker indigo for white-text buttons, and lighter accents on dark surfaces where needed for contrast.
- A geometric letter mark cannot be guaranteed globally unique; human brand and trademark review remains outstanding.
- No database, authentication, analytics, email service, public interactive demo, marketing template or new PDF is part of the expanded scope.
- The local workbench has no secrets or network-backed submission. Its form demonstrates accessible local validation only.
- Browser checks and automated accessibility scans provide bounded evidence, not a full assistive-technology or production audit.
- No paid service, domain purchase or deployment is authorized by this scope.

## Review gate

The master specification requires a review gate between milestones unless explicitly authorized. The user subsequently authorized the next phase, so Milestone 2 proceeded alongside completion of the foundation. Review the brand and website before proceeding to Milestone 3. Public contact details were not supplied; the user accepted configurable details and a local enquiry preview, so message delivery remains unimplemented and clearly labeled.
