# Marketing and presentation handover

## Editable templates

Open `assets/marketing/index.html` in a browser. It links 18 layouts: nine formats in English and Simplified Chinese. Each uses the same original vector logo, palette and locally loaded licensed fonts. Bracketed contact/customer fields are deliberate placeholders; replace them before use.

| Format | Native canvas |
| --- | --- |
| Facebook ad | 1200 x 630 px |
| Instagram square | 1080 x 1080 px |
| Instagram portrait | 1080 x 1350 px |
| Instagram story | 1080 x 1920 px |
| WhatsApp poster | 1080 x 1350 px |
| Business card front and back | 1050 x 600 px per side |
| Company profile and quotation covers | 1240 x 1754 px each |

These are authoring sizes, not a claim about current platform advertising requirements. The card canvas corresponds to 3.5 x 2 inches at 300 pixels/inch; ask the printer for required bleed, color profile and finishing before printing. The covers approximate A4 proportions. Story content reserves space above and below the main message.

Browser copy is contenteditable for quick experiments. Those changes are temporary and are lost on reload. For durable changes, edit `scripts/generate-marketing.mjs` and regenerate. Direct changes to generated HTML are possible, but the generator will overwrite them. To keep custom edits, save a separately named copy and run only the preview exporter against it.

```sh
npm run marketing:generate
```

This creates HTML/CSS, exports exact-size PNGs to `assets/marketing/previews`, and checks fonts, images, overlapping content and canvas bounds. Open-source Inter and Noto Sans SC fonts are self-hosted; retain the license files. The website itself remains English; Chinese support here refers to marketing/presentation assets, not a full translated website.

## Twelve-page presentation

`output/pdf/kezuvio-brand-presentation.pdf` is generated from editable HTML/CSS in `documents/brand-presentation`. It covers the requested twelve subjects, with vector logos and selectable text. The canvas is 1440 x 810 CSS pixels (16:9); Chromium may round PDF page dimensions by fractions of a point.

```sh
npm run pdf:brand
pdftoppm -scale-to 1440 -png output/pdf/kezuvio-brand-presentation.pdf documents/brand-presentation/qa/page
```

The exporter checks page count, content bounds, assets and fonts before export. Inspect every rendered page after edits. Current twelve page renders were reviewed with no clipping, unintended overlap or distorted images found. Website/product panels in the deck are newly composed editable layout studies, labeled where illustrative; no old reference screenshot was stretched into a final page.

## Review before release

The six-page handover PDF is generated from `docs/final-delivery-report.md` using `python scripts/export-delivery-report.py` with ReportLab installed. Run `python scripts/check-delivery-artifacts.py` with pypdf to validate PDF page counts, selectable text, font embedding and retained layout checks.

Approve the original K mark, English/Chinese copy, public contact fields and final service offering. The studio is still a provisional brand, with no registration or trademark-clearance claim. Marketing and PDF files have been created locally; none have been posted or sent to customers.
