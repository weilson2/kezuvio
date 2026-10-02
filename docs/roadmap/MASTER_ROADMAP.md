# KEZUVIO LABS — MASTER DEVELOPMENT ROADMAP
## M5–M12 | Six Products, AI Team, Business Platform and Launch Preparation

You are the Principal Software Architect, Engineering Lead and AI Project Manager for Kezuvio Labs.

Your objective is to complete the remaining development roadmap while preserving the existing applications and maintaining high engineering quality.

**Project root:** `D:\WORKKK\kezuvio`

Do not create a second Kezuvio repository.

## 0. CURRENT PROJECT STATE

The following milestones are completed:

- M0: Architecture and planning
- M1: PostgreSQL platform and isolated workspaces
- M2: Cafe POS & QR Ordering
- M3: Commerce Studio
- M4: AI Automation Hub

M4 was accepted at commit `1bc788e`, tag `labs-m4-accepted-2026-11-11`.

M5 Property CRM has an approved-in-principle development plan but is not yet confirmed as implemented.

Before beginning:
1. Inspect the latest Git status, commits and tags.
2. Read existing AGENTS.md, architecture, tooling, backlog and progress documents.
3. Identify the actual current milestone and avoid duplicating completed work.
4. Preserve the existing website, all legacy demo routes, branding, Ledger Lite and unrelated user changes.
5. Review available Codex models, MCP servers, Skills and subagents.
6. Verify the local PostgreSQL development and test environments.

Do not overwrite existing work.

## 1. PROJECT MANAGEMENT

Create or update a persistent master backlog:

`docs/roadmap/MASTER_BACKLOG.md`

Track:

- Milestone
- Task ID
- Description
- Priority
- Dependency
- Assigned agent
- Status
- Acceptance criteria
- Test evidence
- Actual implementation notes
- Remaining issues

Use these task statuses:

BACKLOG → READY → IN_PROGRESS → TESTING → REVIEW → ACCEPTED.

Maintain a progress summary after every meaningful development batch.

Do not repeatedly ask which task to do next. Follow the dependency order in this roadmap.

Do not treat a passing automated test as user acceptance. At milestone boundaries, provide a manual acceptance checklist and request approval before marking the milestone accepted or moving to the next major milestone.

Stop immediately for destructive changes, major scope changes, paid purchases, external publication or production operations requiring approval.

---

# M5 — PROPERTY CRM

## Goal

Build a persistent interactive property-sales CRM at:

`/demo/property-crm`

Reuse the existing Labs platform.

### M5.1 Property listings

Implement:
- Create and edit fictional properties
- Property types and availability
- Location and asking price in RM
- Search and filtering
- Property details
- Archive and restore rules
- Linked lead counts

### M5.2 Contacts and leads

Implement:
- Contact records
- Multiple leads per contact
- Lead sources
- Lead assignment
- Lead search and filters
- Activity history
- Safe archiving

### M5.3 Sales pipeline

Stages:

New → Qualified → Viewing → Offer → Won

Support Lost from an eligible open stage with a required reason.

Enforce the existing M5 plan's transition requirements, including agent assignment and recorded viewings.

Provide accessible keyboard controls.

### M5.4 Agent management

- Fictional agent roster
- Assign and reassign leads
- Agent workload
- Deactivation restrictions
- Assignment audit history

### M5.5 Viewing appointments

- Schedule and reschedule
- Cancel and complete
- Detect overlapping agent or listing bookings
- Allow adjacent bookings
- Preserve bookings after failed changes
- Store UTC and display Malaysian local time

### M5.6 Follow-ups

- Create reminders
- Due and overdue status
- Complete or cancel
- Lead next-action summary

### M5.7 Analytics

- Leads by stage
- Active agent workload
- Upcoming viewings
- Overdue follow-ups
- Won and lost counts
- Closed-lead conversion
- Distinct active-listing asking value

Verify the RM1,050,000 and 50.0% reference analytics fixture from the existing M5 plan.

### M5.8 Testing

Include domain, database, concurrency, isolation, idempotency, Playwright, responsive accessibility and full regression tests.

Stop for M5 manual acceptance.

---

# M6 — ACCOUNTING CLOUD

## Goal

Build an interactive accounting demonstration at:

`/demo/accounting-cloud`

This must be a real accounting logic demonstration, not a static financial dashboard.

### M6.1 Accounting foundation

- Chart of accounts
- Account categories
- Accounting periods
- Opening balances
- Balanced double-entry journal postings
- Immutable posted entries with controlled reversal

### M6.2 Transactions

- Income
- Expenses
- Customer invoices
- Supplier bills
- Receipts
- Payments
- Credit notes
- Adjustments

### M6.3 Accounts receivable and payable

- Customer balances
- Supplier balances
- Outstanding invoices
- Partial payments
- Due and overdue status
- Aging reports

### M6.4 Financial reporting

- General ledger
- Trial balance
- Profit and loss
- Balance sheet
- Cash and bank summary
- Date-filtered reporting

Every report must reconcile with the underlying posted journals.

### M6.5 Reconciliation and inventory

- Fictional bank transactions
- Manual transaction matching
- Reconciliation differences
- Product inventory valuation demonstration
- Defined inventory costing policy

### M6.6 Malaysia-oriented presentation

Use:
- MYR currency
- Malaysian date conventions
- Clear invoice references
- Fictional Malaysian SMEs

Do not claim LHDN, MyInvois, SST or other regulatory certification.

Real filing, tax submission and official e-Invoice integration are excluded.

### M6.7 Testing

Test accounting invariants, balanced journals, posting and reversal logic, rounding, report reconciliation, permissions, database isolation and concurrent changes.

Include a separate accounting acceptance checklist with numeric expected results.

Stop for M6 manual acceptance.

---

# M7 — INTERIOR 3D STUDIO

## Goal

Build an interactive room-design application at:

`/demo/interior-3d`

### M7.1 3D foundation

Use Three.js and React Three Fiber where compatible with the existing application.

Implement:
- Interactive 3D room
- Camera orbit and zoom
- Room presets
- Wall and floor surfaces
- Dimension controls

### M7.2 Furniture configurator

- Fictional furniture catalog
- Insert and remove furniture
- Move and rotate objects
- Object selection
- Size and placement constraints
- Basic collision or boundary feedback

### M7.3 Materials

- Wall colors
- Floor materials
- Furniture finishes
- Immediate visual preview

### M7.4 Cost estimation

- Furniture item pricing
- Quantity and configuration costs
- Room design total
- Configurable demo pricing
- Clear distinction between illustrative and real quotations

### M7.5 Save and export

- Persist design
- Load previous design
- Duplicate design
- Export screenshot
- Reset workspace

### M7.6 Performance

Test desktop and mobile viewport sizes.

Lazy-load large 3D assets.

Provide loading and unsupported-WebGL states.

Use properly licensed or self-created 3D assets.

### M7.7 Testing

Verify scene serialization, pricing, object transforms, persistence, reset isolation, UI controls and representative browser rendering.

Stop for M7 manual acceptance.

---

# M8 — KEZUVIO LABS WEBSITE INTEGRATION

## Goal

Turn the existing Kezuvio Labs website into a professional software-studio portfolio.

Do not replace the established brand or rebuild the website unnecessarily.

### M8.1 Website pages

Complete or improve:

- Homepage
- About Us
- Services
- Website Development
- Custom Software Development
- POS Solutions
- AI Automation
- Portfolio
- Pricing
- Contact
- FAQ

### M8.2 Six interactive demos

Present all six demos with:

- Product overview
- Feature highlights
- Screenshots
- Try Live Demo
- Demo limitations
- Target customer types
- Request Quotation

Keep the six existing legacy demo URLs working.

### M8.3 Design system

Use a consistent modern, creative and premium visual identity.

Requirements:
- Responsive layouts
- Dark and light theme where already supported
- Accessible navigation
- Consistent typography
- Subtle motion
- Fast loading
- Reusable components

### M8.4 Website pricing drafts

Prepare clearly labeled draft packages:

- Landing Page
- Business Website
- E-commerce Website
- Custom POS
- CRM
- AI Automation
- Website Maintenance

Include scope, revision allowance, exclusions, delivery assumptions and optional services.

Do not publish or finalize prices without founder approval.

### M8.5 Conversion

- Clear CTA buttons
- WhatsApp inquiry links
- Contact forms
- Request quotation flow
- Portfolio-to-service navigation

Use demonstration submissions locally until real communications and data-handling arrangements are approved.

Stop for M8 manual acceptance.

---

# M9 — CLIENT ACQUISITION, SEO, GEO AND QUOTATIONS

## M9.1 Technical SEO

Implement:

- Page titles and meta descriptions
- Canonical URLs
- XML sitemap
- Robots directives
- Structured data where applicable
- Accessible headings
- Internal linking
- Image optimization
- Social sharing metadata
- Core Web Vitals improvements

Do not expose demo reset or acceptance-only endpoints to search indexing.

## M9.2 Local SEO

Prepare content for relevant Malaysian customers, including Kuala Lumpur, Johor Bahru and other appropriate service markets.

Avoid fake reviews, invented projects or unsupported business claims.

## M9.3 GEO and AEO

Create useful, factual content that answers customer questions about:

- Website development costs
- POS systems
- Custom CRM development
- AI automation
- E-commerce development
- Website maintenance

Use clear FAQs, structured information and demonstrable expertise.

Do not promise rankings or AI recommendations.

## M9.4 Lead management

Build a controlled local workflow:

Inquiry → Qualification → Quotation Draft → Human Review → Approved Proposal → Follow-up.

Reuse existing Automation Hub capabilities where possible.

## M9.5 Analytics

Prepare event tracking for:
- Demo visits
- Try Demo clicks
- Pricing views
- WhatsApp clicks
- Contact submissions
- Quotation inquiries

Use development-mode analytics until privacy, consent and production configuration are approved.

Stop for M9 manual acceptance.

---

# M10 — KEZUVIO AI EMPLOYEE TEAM

## Goal

Establish a configurable AI-assisted operations system using Codex, Skills, MCP and task orchestration.

### M10.1 AI roles

Configure six agents:

**Alex — Project Manager**
- Task breakdown
- Dependencies
- Coordination
- Milestone reports

**Sam — Software Engineer**
- Frontend
- Backend
- Database
- API development

**Mia — UI/UX Designer**
- Page design
- Components
- Responsive layouts
- Accessibility

**Ada — QA and Security**
- Tests
- Code review
- Security assessment
- Regression validation

**Cleo — Marketing**
- SEO content
- Social media drafts
- Campaign plans
- Demo descriptions

**Ava — Business Operations**
- Quotations
- Project proposals
- Client requirements
- Business analysis

### M10.2 Skills

Create reusable Skills for:
- Requirements analysis
- Full-stack development
- UI design
- Testing
- Security review
- Marketing
- Business proposals
- Release preparation

Follow verified Codex conventions.

### M10.3 MCP

Audit and configure trusted MCP integrations for:

- Development documentation
- GitHub
- Playwright
- Database access
- Other justified project tools

Prefer read-only access when possible.

Do not add duplicate MCP services.

### M10.4 Model selection

Evaluate supported automatic model selection and per-agent settings.

Optimize for quality and usage budget.

- Simple tasks: economical supported model
- Regular development: balanced supported model
- High-risk architecture: stronger supported model

Do not assume particular model names, prices, auto-routing capabilities or billing entitlements without checking the installed Codex environment.

Use no more than two concurrent subagents initially.

### M10.5 Task orchestration

Build or extend:
- Task assignments
- Status tracking
- Execution logs
- Retry limits
- Timeout controls
- Usage metrics
- Human approval checkpoints
- Error reporting

Reuse existing components instead of building another platform unnecessarily.

### M10.6 Mobile control

Prepare an authenticated mobile-friendly control dashboard.

Telegram integration may be prototyped locally using mock events.

Do not create a publicly accessible command endpoint or activate external messaging without approval.

### M10.7 Safety

Require explicit approval for:
- Production changes
- Database deletion
- Payments
- Paid API activation
- External publication
- Customer communications
- Credentials or permission escalation

Prevent prompt-injection-driven tool execution and unauthorized workspace access.

Stop for M10 manual acceptance.

---

# M11 — QUALITY, SECURITY AND DEPLOYMENT READINESS

## M11.1 Full product regression

Test all six interactive demos.

Validate:
- Data persistence
- Workspace isolation
- Independent reset
- Permissions
- Concurrent transactions
- Idempotency
- Browser refresh recovery
- Database restart recovery

## M11.2 Security review

- Authentication boundary audit
- Input validation
- CSRF and origin checks
- XSS prevention
- SQL injection defense
- RLS permissions
- Rate limits
- Dependency review
- Secret scanning
- Sensitive log review
- Safe error messages

## M11.3 Performance

- Mobile responsiveness
- 3D rendering performance
- Database query efficiency
- Bundle size
- Memory usage
- Page loading

## M11.4 CI/CD

Prepare build and test pipelines.

No direct production deployment.

## M11.5 Backup and recovery

- Backup procedure
- Restore rehearsal
- Database migration recovery
- Workspace reset verification
- Documentation

## M11.6 Deployment planning

Compare appropriate low-cost hosting options.

Provide:
- Expected monthly cost
- Resource requirements
- Database hosting requirements
- Storage and backup needs
- Security considerations
- Rollback procedure

Do not purchase a domain, provision cloud infrastructure or deploy publicly.

Stop for M11 manual acceptance.

---

# M12 — BUSINESS OPERATIONS AND COMMERCIAL READINESS

## M12.1 Service packages

Prepare:
- Landing Page packages
- Business Website packages
- E-commerce packages
- POS customization
- CRM customization
- AI automation packages
- Maintenance subscriptions

## M12.2 Pricing and profitability

Create editable estimates for:
- Development hours
- AI subscription costs
- API costs
- Hosting
- Domain
- Maintenance
- Support
- Gross margin
- Proposed selling price

Present assumptions clearly and avoid inventing verified market prices.

## M12.3 Client documents

Prepare editable drafts of:
- Client questionnaire
- Project proposal
- Quotation
- Scope of Work
- Change request
- Acceptance checklist
- Maintenance agreement
- Handover document

Flag legal and tax terms for local professional review before commercial use.

## M12.4 Sales materials

Prepare:
- Portfolio descriptions
- Demo walkthrough scripts
- Service comparison tables
- Website copy
- Social media content plans
- Customer FAQ

## M12.5 Final business readiness review

Evaluate whether Kezuvio Labs is prepared to:
- Demonstrate products
- Collect qualified inquiries
- Prepare estimates
- Deliver software projects
- Support customers
- Maintain application updates

Produce an outstanding-items report before any public launch.

---

# GLOBAL ENGINEERING RULES

1. Work only in `D:\WORKKK\kezuvio` unless explicitly authorized otherwise.
2. Preserve Ledger Lite and other existing projects.
3. Never use `git add .` blindly when unrelated modifications exist.
4. Use isolated branches or worktrees for concurrent development where appropriate.
5. Keep PostgreSQL development and test environments separate.
6. Use additive, reviewed database migrations.
7. Never use real customer data in public demonstrations.
8. Keep all demo payments fictional.
9. Maintain existing routes and backward compatibility.
10. Reuse shared architecture, design components, authentication boundaries and testing infrastructure.
11. Test every milestone before requesting acceptance.
12. Never report unexecuted tests as passed.
13. Commit only verified and intended changes.
14. Create acceptance tags only after explicit founder acceptance.
15. Avoid unnecessary packages, services, models and Token consumption.
16. Do not add paid services without authorization.
17. Do not silently change the approved product scope.
18. Track known limitations honestly.
19. Maintain useful technical and operational documentation.
20. Record completed work in the master backlog so future Codex sessions can resume accurately.

---

# MILESTONE HANDOFF FORMAT

At the end of each milestone provide:

1. Features implemented
2. Files changed
3. Database migrations
4. Tests executed and results
5. Manual acceptance URL
6. Manual acceptance checklist
7. Remaining limitations
8. Actual additional costs
9. Git commit information
10. Recommended next milestone

Mark the milestone REVIEW until I explicitly accept it.

After acceptance, continue with the next milestone in this roadmap without requiring a newly written development specification.

---

# IMMEDIATE INSTRUCTIONS

Start by checking the current repository against this roadmap.

Create or update `docs/roadmap/MASTER_BACKLOG.md`.

Identify completed milestones and their acceptance evidence.

Begin M5 Property CRM implementation using the existing 11 November 2026 development plan.

Do not rebuild M1–M4.

Do not start M6 until M5 passes its acceptance gate.

Follow the roadmap through M12, one milestone at a time, maintaining the backlog and preserving all prior work.

The ultimate goal is a complete Kezuvio Labs software-studio foundation with six functional demos, a professional portfolio, reusable AI tooling, client acquisition workflows and documented commercial readiness.
