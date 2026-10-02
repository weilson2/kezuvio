# Service estimate model

The [editable workbook](../../outputs/roadmap-m12/kezuvio-estimates.xlsx) is an internal quotation draft, not an approved price list. It covers Landing Page, Business Website, E-commerce, POS customization, CRM customization, AI automation and one month of Maintenance. The first six columns represent one project; their stated hosting allowance covers one month and their domain allowance, where nonzero, covers the first year. Future renewals must be quoted separately.

All hardcoded values are illustrative internal assumptions dated23 November 2026. They are neither verified market prices nor actual spending. No AI subscription/API entitlement or supplier quote is implied. A zero allowance means excluded or client supplied; it never establishes a free vendor service. Review scope, client dependencies, workload and vendor quotes before using any proposed selling price.

## Editing

Open the `Estimates` sheet. Blue values on amber cells are editable. Each package has its own development hours, hourly internal cost, AI subscription allocation, API/hosting/domain allowances, maintenance/support hours, target gross margin and optional selling-price override. Monetary inputs are integer **sen**;100sen=RM1. Outputs at the top display RM. Keep AI allocation proportional to the project use of an existing subscription rather than charging the full subscription to every project without explanation.

The calculation uses development hours × internal hourly cost, maintenance/support hours × hourly cost, plus the four tool/infrastructure allowances. It rounds labor costs to whole sen. Price at target margin is direct cost ÷(1−target margin), rounded up to the next sen. Gross profit is proposed price less direct cost; margin is profit ÷price. This is gross contribution under these assumptions, excluding general overhead and tax, and is not a net-profit forecast. Add those costs deliberately when estimating a real engagement.

A blank price override selects the calculated target price. A numeric zero deliberately quotes zero and leaves margin unavailable instead of silently restoring the suggested price. Missing required numeric inputs produce unavailable results. A target margin below0 or at/above100% is unavailable. Monetary/hour fields have nonnegative whole-number validation; do not bypass it by pasting invalid data.

## Verified examples

The sample Landing Page has16development hours at5000sen/hour,1support hour and10000sen tool/infrastructure allowance. Direct cost is **RM950.00**; at40%target margin, proposed price is **RM1,583.34**. E-commerce direct cost is **RM4,380.00** and proposed price **RM7,300.00**. Maintenance direct cost is **RM205.00 per month**, proposed **RM341.67**. These are examples for reviewing the model, not published offers.

Change Landing Page hours to20: cost must become **RM1,150.00**. Restore16 afterward. A zero price override must remain zero, with unavailable margin. Clear the override to restore the formula. The AI/API/hosting/domain allowances, support hours and target margin remain review inputs; do not treat the sample40%target as founder approval.

The bundled Artifact Tool calculated and rendered the workbook. Checks covered first/middle/last package values, effort changes, blank/zero override, missing hourly rate, invalid100%margin and restoration. The exported XLSX was reopened; formulas remained live and an effort change recalculated correctly. Formula-error scan matched zero entries. Native Microsoft Excel execution was not performed because it is not installed; validate the workbook in the intended client spreadsheet application before issuing a commercial quote.
