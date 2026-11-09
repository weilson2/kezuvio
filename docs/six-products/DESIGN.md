# Initial product design system

Proposal, not a new UI implementation. Retain Kezuvio's existing brand and Inter fonts. Use `packages/brand/tokens.json`, `tokens.css`, `base.css` and `packages/ui/index.tsx` as the source of truth.

## Visual language

Light mode uses cloud `#F8FAFC`, white surfaces, ink `#0B1220` and accessible primary `#4F46E5`; dark mode uses `#0B1220` background, `#111C30` surfaces, `#F8FAFC` text and `#A5A6FF` primary. Use semantic tokens rather than raw swatches in controls. Existing brand contrast assertions passed in Phase 0; new component states still need testing.

Keep the 4px spacing scale, 8px control radius and 16px panels. Product screens use compact headings (24–32px), 16px body copy and tabular money; reserve existing oversized display typography for marketing. Indigo marks primary actions, cyan focus, and labeled semantic status colors distinguish success/waiting/error without relying on color alone. Respect reduced motion.

## Shared shell

Top bar: Kezuvio / product name, “Fictional demo”, theme, current simulated role and time remaining. Product navigation sits in a left rail on desktop and a labeled menu on small screens. Workspace reset is a secondary action with a confirmation naming the product and loss of sample changes.

Main area: page heading and primary action; brief totals only where useful; filter/search; actual records. Use task-specific empty states, inline validation, disabled pending submissions, retryable errors and success announcements. Show RM with two decimals; display operational dates in Asia/Kuala_Lumpur and keep stored instants in UTC. Distinguish date-only accounting records from instants.

Prefer existing Button/Field/Card/icon primitives. New reusable components: ProductShell, DemoNotice, RoleSwitcher, ResetDialog, StatusBadge, Money, EmptyState, ErrorNotice, DataTable, ConfirmAction and ReceiptPreview. Add a component only when a real screen needs it; business rules remain outside UI.

## Cafe screen plan

| View | Primary layout and action | Critical states |
| --- | --- | --- |
| Customer | Table banner, menu categories, item/variant cards, cart drawer; Place demo order | Out of stock, price change, empty cart, submitting, accepted order/status |
| Kitchen | Received/Preparing/Ready ticket columns with table, age and item quantities; Advance status | No tickets, stale update, disconnected polling, forbidden transition |
| Cashier | Table/unpaid order list beside order detail and tender panel; Settle payment | Closed shift, insufficient cash, already paid, simulated failure, change due |
| Inventory | Item/available/reserved/on-hand columns, explicit manager adjustment | Low stock, invalid quantity, conflict and saved audit reference |
| Reports | Shift/net sales/refunds, payment mix, transaction table | No sales, date filter with no matches, unavailable data |
| Receipt | Compact printable itemization with demo watermark, tender/change | Print preview, reprint, refund indication; printing never settles a sale |

Desktop cashier layout: approximately 30% order list, 40% details, 30% tender. At tablet widths use two columns; at 375px use stacked sections with a persistent order-summary action that does not hide focused content. Kitchen lanes can scroll individually, while the page itself avoids horizontal overflow.

Customer/table switching is private to a visitor demo session; do not imply that scanning a public QR code automatically shares another visitor's live order. A future shared restaurant session needs a distinct trusted table/customer access model.

## Other products

- Automation: inquiry detail beside requirements/quote; execution timeline and approval actions display real persisted state.
- Commerce: retain product card/cart patterns; give seller screens their own navigation and role context.
- Property: pipeline cards, listing details and appointment calendar/list; keyboard “Move to stage” alternatives.
- Accounting: journal line grid with visible balance difference; drill down from statements to journal/document; clearly name cash versus accrual views.
- Interior: 3D canvas, furniture library, properties/transform inspector and live quote; numeric editing and scene summary remain usable without dragging.

## Acceptance

Check at 375, 768 and 1440px in both themes; no unintended page overflow. Keyboard focus remains visible and returns correctly after dialogs; pending/loading updates use suitable live regions. Controls have labels, errors connect to fields, and touch targets aim for at least 44px. Test keyboard-only completion of the primary journey and automated accessibility checks, then inspect rendered screenshots. Automated scans are bounded evidence, not an accessibility certification.
