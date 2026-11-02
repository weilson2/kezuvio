# Kezuvio Labs — brand foundation v0.1

**Core brand:** Kezuvio. **Studio name:** Kezuvio Labs.

**Slogan:** Create. Build. Evolve.

**Secondary message:** Digital Solutions for Growing Businesses.

Kezuvio is a provisional identity for a proposed Malaysian software development studio serving SMEs. Do not imply registration, trademark clearance, clients, awards or verified commercial outcomes.

## Logo system

The original geometric K is drawn on a 100-unit grid: a 19-unit vertical spine and two directional arms. The construction is authored in `scripts/generate-brand.mjs`. It is inspired by the supplied reference’s angular and colorful direction, not traced from its artwork. No competitor mark was used as a source. Global uniqueness and trademark availability have not been assessed.

The wordmark is lowercase “kezuvio.” in outlined Inter Bold, paired with spaced “LABS”. All exported lettering is vector paths: the SVG needs no font installation and contains no bitmap image.

| File naming | Intended use |
| --- | --- |
| `kezuvio-horizontal-*.svg` | Website navigation, broad layouts and document headers |
| `kezuvio-stacked-*.svg` | Centered, compact compositions |
| `kezuvio-icon-*.svg` | App identity and small square placements |
| `*-light.svg` | Full color on a light background, dark wordmark |
| `*-dark.svg` | Full color on a dark background, light wordmark |
| `*-mono-dark.svg` | Solid dark ink on light backgrounds |
| `*-mono-light.svg` | Solid light ink on dark backgrounds |

Maintain clear space of at least one spine width (19/100 of the icon artboard). Use horizontal lockups at 150 px or wider; stacked at 150 px or wider; icon at 32 px or larger. The 32 px favicon uses solid lilac/cyan with a navy tile to retain a clear silhouette. App assets include SVG, 180/192/512 px PNGs and a 32 px PNG-backed ICO. The PNGs retain square proportions. No offline or installed-PWA behavior is implied by these assets.

Never stretch, compress, rotate, outline, add shadows to or rearrange the logo. Use a background treatment with sufficient separation. Preserve the SVG viewBox. Prefer monochrome for single-ink applications. Use the actual slogan as live text beside artwork instead of squeezing it into the small navigation lockup.

## Color and themes

`packages/brand/tokens.json` is the source of truth. Run `npm run brand:generate` after editing it; do not hand-edit generated `tokens.css`. Brand swatches preserve the supplied palette. Semantic tokens adapt those colors to readable UI roles.

| Role | Light | Dark |
| --- | --- | --- |
| Background | #F8FAFC | #0B1220 |
| Surface | #FFFFFF | #111C30 |
| Main text | #0B1220 | #F8FAFC |
| Muted text | #526077 | #ADBBD0 |
| Primary action | #4F46E5 | #A5A6FF |
| Primary label | #FFFFFF | #0B1220 |
| Focus indicator | #4338CA | #22D3EE |

The darker light-theme action indigo is an intentional refinement: the original #6366F1 stays a brand swatch, while #4F46E5 provides stronger contrast with white button text. Cyan and purple are accents, not universal text colors. Use semantic variables such as `--text`, `--surface` and `--primary` in UI components. Both themes are checked by automated contrast tests. Decorative interface concepts have their own fixed light surfaces.

## Typography

Inter is self-hosted under the SIL Open Font License, included at `assets/fonts/OFL.txt`. The site ships Latin subsets at weights 400, 500, 600, 700 and 800. SVG wordmarks use outlined weight 700. Do not rename or redistribute modified font files without observing the license. Marketing and presentation assets also use self-hosted Noto Sans SC at weights 400, 600 and 700; the font files, CSS and license are in `assets/marketing/fonts`. The eighteen English/Chinese templates are delivered; see `marketing-delivery.md` for editing and export instructions.

| Style | Rule |
| --- | --- |
| Display | fluid 3.4–6.75 rem; weight 600; tight line height |
| Section heading | fluid 2–3.25 rem; weight 600 |
| Component heading | 1.5 rem base; weight 600 |
| Lead | 1.125 rem, comfortable 1.8 line height |
| Body | 1 rem, 1.65 line height |
| Small / caption | 0.875 / 0.75 rem; reserved for secondary information |

Headlines are direct and concrete. Explain what the tool helps a business do. Avoid unsupported claims, exaggerated guarantees and technical detail that does not help a customer decide.

## Layout and components

Use a 4 px spacing basis: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80 and 96 px. Main content maxes at 1240 px with fluid 20–64 px side gutters. Radii are 8 px controls, 16 px cards, 24 px large surfaces and pill badges. Shadows are restrained; borders carry most grouping.

Desktop service grids have three columns, tablet two and mobile one. The main website changes layout at 1100, 850 and 600 px; additional large-desktop tuning starts at 1500 px. These are content-driven breakpoints, not device assumptions. Validate 1920, 1440, 1366, 1024, 768, 390 and 375 px explicitly.

`packages/ui/index.tsx` exports `Button`, `Badge`, `Card`, `Field`, `TextArea`, `Icon` and `BrandLogo`. They use native HTML controls and typed React props. Buttons default to `type="button"`; submission is explicit. Navigation actions remain links. Field labels are associated with IDs; errors and help are connected with `aria-describedby`. Active fields have visible focus rings; disabled states are visibly distinct. Reduced-motion preferences disable transitions and smooth scrolling.

```tsx
import { Button, Field, Card } from '@kezuvio/ui';

<Card>
  <Field id="business" label="Business name" help="How should we refer to your business?" />
  <Button type="submit">Continue</Button>
</Card>
```

The website navigation, service cards, CTA and concept visuals live in `apps/website/components`. Avoid moving routing or business logic into primitive UI components. `/brand` is the interactive review surface for logo selection/download, color copying, typography and component states.

## Review remaining

Review the K silhouette, wordmark proportions, tone and theme direction. Trademark clearance remains external to this design exercise. Full screen-reader and cross-browser audits remain future work; automated scans are not a certification.
