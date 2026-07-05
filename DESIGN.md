---
name: "Termometro de Madrid"
description: "A mobile-first civic heat-reporting PWA for Metro de Madrid AC conditions."
colors:
  bg: "oklch(0.985 0.012 92)"
  bg-dark: "oklch(0.145 0.036 252)"
  surface: "oklch(0.957 0.011 96)"
  surface-dark: "oklch(0.205 0.034 250)"
  surface-raised: "oklch(0.997 0.006 96)"
  surface-raised-dark: "oklch(0.255 0.037 248)"
  ink: "oklch(0.190 0.018 160)"
  ink-dark: "oklch(0.955 0.000 0)"
  muted: "oklch(0.450 0.014 160)"
  muted-dark: "oklch(0.730 0.028 245)"
  border: "oklch(0.860 0.014 96)"
  border-dark: "oklch(0.360 0.040 248)"
  primary: "oklch(0.520 0.125 160)"
  primary-contrast: "oklch(0.990 0.000 0)"
  metro-red: "oklch(0.560 0.210 28)"
  metro-blue: "oklch(0.530 0.180 250)"
  heat-fresco: "oklch(0.680 0.145 235)"
  heat-fresco-soft: "oklch(0.955 0.030 235)"
  heat-calor: "oklch(0.720 0.165 72)"
  heat-calor-soft: "oklch(0.965 0.040 72)"
  heat-infierno: "oklch(0.590 0.210 32)"
  heat-infierno-soft: "oklch(0.955 0.040 32)"
  success: "oklch(0.555 0.130 150)"
  warning: "oklch(0.710 0.160 76)"
  danger: "oklch(0.565 0.210 30)"
typography:
  display:
    fontFamily: "Geist, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 680
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Geist, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 620
    lineHeight: 1.25
    letterSpacing: "0"
  body:
    fontFamily: "Geist, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "Geist, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 580
    lineHeight: 1.2
    letterSpacing: "0"
  data:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 560
    lineHeight: 1.25
    letterSpacing: "0"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-contrast}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-heat:
    backgroundColor: "{colors.heat-infierno}"
    textColor: "{colors.primary-contrast}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: Termometro de Madrid

<!-- SEED -->

## 1. Overview

**Creative North Star: "Flighty Status, Raycast Action"**

Termometro de Madrid should feel like a sharp public evidence tool built for a hot train platform: fast to read, easy to share, and calm enough to trust while still carrying a dry satirical edge. The product should combine Flighty-like mobile status intelligence with Raycast-like action clarity: a confident current-state surface first, then two obvious actions.

The default interface is light because people will use and screenshot it on phones in stations, trains, and outdoor transitions. Dark mode is supported from v1, but it should be a true theme switch, not the main visual identity. Heat is expressed through state, charts, and micro-motion, not through a permanently hot background.

The system rejects official Metro de Madrid mimicry, generic complaint-counter dashboards, cartoon flames, glassmorphism, oversized rounded cards, and single average metrics that make L1 and L5 disappear into a network-wide score.

**Key Characteristics:**

- Flighty-style live status surface with Raycast-style primary actions: Reportar and Explorar.
- Restrained light surfaces, crisp borders, 8px cards, and compact data density.
- Heat colors encode condition; Metro line colors identify lines.
- Dashboard modules are self-contained, screenshot-friendly evidence blocks.
- Satirical copy appears in helper text, summaries, empty states, and share cards, not in core controls.

### Reference Pass

- **Observable Plot** (`https://observablehq.com/plot/`): Primary chart inspiration. Adopt the grammar mindset: compose bars, lines, dots, scales, small multiples, and transforms deliberately. Even though v1 uses Recharts, chart components should be designed as reusable visual grammar, not one-off pictures.
- **Linear** (`https://linear.app/`): Adopt the precision: dense but calm layouts, compact labels, clear hierarchy, subtle separators, and highly consistent component vocabulary. Avoid copying its dark SaaS mood or product-management structure.
- **Raycast** (`https://www.raycast.com/`): Core action reference. Adopt centered action clarity and command-palette discipline: one obvious next action, compact rows, fast feedback, and utility controls that do not compete with the primary task. Avoid making Termometro feel like a desktop launcher.
- **Flighty** (`https://www.flighty.com/`): Core mobile-status reference. Adopt one strong current-state panel, crisp travel/status details, restrained delight, and share/export affordances that feel native. Avoid heavy 3D or map hero treatments for v1.
- **Citymapper** (`https://citymapper.com/`): Adopt small transport-specific humor and useful weirdness: tiny route/status jokes, obvious mode chips, and local transit personality. Avoid the busy map/search surface; Termometro is not a route planner.
- **Datawrapper** (`https://www.datawrapper.de/`): Adopt chart discipline: mobile exports, non-overlapping labels, accessible colors, brand consistency, and responsive preview thinking. Every dashboard module should be checked as a shareable mobile artifact.
- **FixMyStreet** (`https://www.fixmystreet.com/`): Functional reference only, not a visual reference. Keep the civic directness and recent-activity proof, but do not inherit its visual style or location-heavy flow.

## 2. Colors

The palette is creamy civic utility with a quiet green primary, Metro red/blue references for the independent mark, a blue-black dark theme, and a three-state heat scale for data.

### Primary

- **Civic Green** (`oklch(0.520 0.125 160)`): Primary actions, selected neutral controls, focus affordances, and links when heat status is not the meaning. It keeps the app independent from Metro's red/blue identity.
- **Independent Metro Red** (`oklch(0.560 0.210 28)`): Logo diamond/alert plate and occasional critical civic emphasis. Do not use it as the default error color when `Infierno` already carries heat semantics.
- **Utility Blue** (`oklch(0.530 0.180 250)`): Logo thermometer stem, secondary civic accent, and cool technical details.

### Secondary

- **Fresco Blue** (`oklch(0.680 0.145 235)`): Comfortable AC state. Use for selected `Fresco`, chart segments, and subtle cool summaries. The soft fill is `oklch(0.955 0.030 235)`.
- **Calor Amber** (`oklch(0.720 0.165 72)`): Default report state and uncomfortable condition. Use for selected `Calor`, warnings, chart segments, and default heat summaries. The soft fill is `oklch(0.965 0.040 72)`.
- **Infierno Red** (`oklch(0.590 0.210 32)`): Intolerable/broken AC state. Use for selected `Infierno`, critical chart segments, and heat shimmer accents after selection. The soft fill is `oklch(0.955 0.040 32)`.

### Neutral

- **Civic Cream** (`oklch(0.985 0.012 92)`): Default light background. Keep it close to neutral and let heat remain data/action color, not wallpaper.
- **Quiet Panel** (`oklch(0.957 0.011 96)`): App shell panels, dashboard bands, table headers, and quiet section backgrounds.
- **Raised Surface** (`oklch(0.997 0.006 96)`): Cards, share modules, form groups, and popovers.
- **Ink Green-Black** (`oklch(0.190 0.018 160)`): Primary text on light surfaces.
- **Muted Green-Gray** (`oklch(0.450 0.014 160)`): Secondary text that must remain readable; never use pale placeholder gray.
- **Border Mist** (`oklch(0.860 0.014 96)`): Dividers, input borders, chip outlines, and chart grid lines.
- **Tech Blue Black** (`oklch(0.145 0.036 252)`): Dark theme background, with blue-black panels and no white radial wash.

### Named Rules

**The Meaning Separation Rule.** Metro line colors identify lines; heat colors communicate AC condition. Do not make one color do both jobs in the same chart mark.

**The Selected Fill Rule.** Unselected line chips stay neutral with a colored dot or short mark. Selected line chips may use the line color as a fill with contrast-correct white or black text plus a check icon or outline.

**The No Heat Wallpaper Rule.** Heat belongs in data, selected states, and primary report action motion, not in the global page background.

**Metro Line Color Working Set.** Use a token map for L1-L12, based on official-ish line identity colors and verified before launch against the current Metro map/source. Suggested implementation tokens: L1 light blue, L2 red, L3 yellow, L4 brown, L5 green, L6 gray, L7 orange, L8 pink, L9 purple, L10 dark blue, L11 teal green, L12 olive. Each line token must define `fill`, `textOnFill`, and `ring`.

## 3. Typography

**Display Font:** Geist, with Inter and system sans fallbacks  
**Body Font:** Geist, with Inter and system sans fallbacks  
**Label/Mono Font:** Geist Mono for timestamps, car codes, report IDs, and compact data

**Character:** One product sans keeps the interface credible and fast. Distinction comes from weight, tabular numbers, spacing, and data composition rather than a second display font.

### Hierarchy

- **Display** (680, 2.25rem, 1.04): Home title and major share-card titles only. Keep letter spacing at `-0.025em`; never tighter than `-0.04em`.
- **Headline** (650, 1.5rem, 1.12): Dashboard module headings, route titles, and major empty states.
- **Title** (620, 1rem, 1.25): Card titles, form group labels, chart captions, and table headings.
- **Body** (400, 0.9375rem, 1.5): Descriptions, methodology, state helper text, and summaries. Cap prose around 65-75ch.
- **Label** (580, 0.8125rem, 1.2): Buttons, chips, control labels, confidence labels, and compact legends. Do not use all-caps tracking as a default style.
- **Data** (560, 0.875rem, 1.25): Car identifiers, timestamps, numeric scores, ranges, and table values. Use tabular numbers.

### Named Rules

**The Data First Rule.** Numbers, line codes, car codes, and confidence labels must align cleanly and use tabular settings. If a chart label wraps badly on mobile, shorten the label before shrinking the type below readable size.

**The No Display Labels Rule.** Buttons, nav items, chips, form controls, and chart labels always use the UI scale, never display typography.

## 4. Elevation

The system is flat by default. Depth comes from tonal layering, borders, spacing, and state changes rather than decorative drop shadows. Shadows are reserved for floating elements that must detach from the page, such as popovers, tooltips, toasts, autocomplete menus, and share/export previews.

### Shadow Vocabulary

- **Popover Shadow** (`0 6px 14px oklch(0.190 0.018 160 / 0.12)`): Autocomplete menus, tooltips, and small floating panels.
- **Toast Shadow** (`0 8px 18px oklch(0.190 0.018 160 / 0.16)`): Undoable submission feedback and temporary confirmations.
- **Share Preview Shadow** (`0 8px 8px oklch(0.190 0.018 160 / 0.10)`): Optional preview lift only; do not pair with a decorative border-and-wide-shadow card style.

### Named Rules

**The Flat-By-Default Rule.** Cards at rest use border or tonal surface, not heavy shadows.

**The No Ghost Card Rule.** Do not combine `border: 1px solid` with a soft shadow blur greater than 8px on cards or buttons.

## 5. Components

### Buttons

- **Shape:** Compact rectangle with 8px radius. Full pill only for tiny status badges or segmented controls.
- **Primary:** Civic Green fill, white text, 12px x 16px padding, medium weight label.
- **Heat Submit:** Submit button inherits selected state meaning: Fresco Blue, Calor Amber, or Infierno Red. Use white text on saturated fills except for pale variants.
- **Hover / Focus:** 150-200ms color/outline transition. Focus ring is 2px outside using Civic Green or the active heat color plus a neutral offset.
- **Secondary / Ghost:** Neutral surface with ink text and a visible border. Ghost buttons are for low-risk utility actions only.
- **Disabled / Loading:** Preserve dimensions. Loading uses inline progress text or skeleton affordance, not a centered spinner that shifts layout.

### Chips

- **Line Chips:** Fixed-size compact buttons. Unselected chips use neutral background, line-colored dot/short bar, ink label, and border. Selected chips use line-color fill, contrast-correct text, check icon, and strong outline.
- **Range Chips:** Neutral segmented controls for `Hoy`, `7 dias`, `1 mes`, `Este verano`. Selected state uses Civic Green or neutral dark fill, not heat color.
- **Status Chips:** Fresco/Calor/Infierno colors only when status is the data meaning.

### Cards / Containers

- **Corner Style:** 8px for cards and dashboard modules, 12px only for larger share cards or app-level panels.
- **Background:** Raised Surface on light theme, raised neutral in dark theme.
- **Shadow Strategy:** Flat at rest. Use border or tonal contrast. Floating overlays may use Popover Shadow.
- **Border:** 1px solid Border Mist. No colored side stripes thicker than 1px.
- **Internal Padding:** 16px on mobile modules, 20-24px for desktop panels and share-card exports.
- **Share Modules:** Every exportable dashboard module needs title, active range, visible legend, chart/table body, key takeaway, and Termometro attribution inside the module bounds.

### Inputs / Fields

- **Style:** Neutral background, 1px border, 8px radius, 12px padding, full-width on mobile.
- **Focus:** Border shifts to Civic Green or active heat color with a 2px outline. No glow unless it is the selected heat state panel.
- **Placeholder:** Must pass contrast; use Muted Green-Gray, not default browser gray.
- **Error / Disabled:** Error uses Danger with text explanation. Disabled state reduces contrast only within WCAG limits and never hides labels.
- **Coche Autocomplete:** Optional field with helper tooltip. Suggestions filter by selected line and rank by recent reports. Accept only loose Metro-style values until the real rule is confirmed.

### Navigation

- **Home:** Compact civic landing with title, mission sentence, live snapshot, two large action buttons, language switch, theme switch, and mandatory disclaimer.
- **App Header:** Small logo mark, current route title, language/theme utilities, and clear back/home affordance on `/reportar`.
- **Raycast-Style Nav:** Use a compact floating or inset top utility bar with crisp active states, icon+label actions where useful, and fast state transitions. It should feel light, precise, and app-like, not like a marketing navbar.
- **No Hamburger By Default:** V1 has few routes. Prefer visible actions and utility buttons. Add a drawer only if methodology/settings grow beyond header capacity.
- **Dashboard Filters:** Sticky or near-sticky line and range controls on mobile. They should never cover chart content.

### Heat State Selector

Three equal-size options: Fresco, Calor, Infierno. Calor is selected by default, but all options have equal visual weight until selected. The explanatory panel below changes color, copy, submit label, and subtle motion based on state. Infierno may become visually intense only after the user selects it.

### Dashboard Modules

Dashboard modules are evidence blocks, not generic metric cards. Lead with ranking and distribution rather than a single average. Modules should include compact helper tooltips for `Indicador Termómetro`, confidence, fleet estimates, and summer range definitions.

Required module styles:

- Heat ranking by line: line identity marks plus heat score bars.
- Heat trend: time-series with heat-color encoding and compact range labels.
- Report volume: bars or area chart with line filtering.
- Worst cars: dense table/list with car code, line, heat score, report count, confidence.
- Fleet coverage: estimated/known caveat visible, with tooltip explanation.
- Recent reports: capped feed/table with line, optional car, state, and time.

### Logo / App Icon

Use a flat red tilted lozenge/diamond behind a blue vertical thermometer. The mark may be Metro-adjacent but must not copy Metro de Madrid's exact logo proportions, wordmark behavior, or brand typography. No logo motion.

## 6. Do's and Don'ts

### Do:

- **Do** use a mostly light creamy interface with dark mode support from v1.
- **Do** use 8px cards, 8px controls, and 12px only for larger app panels or share cards.
- **Do** keep the dashboard vertical on mobile; no chart carousel for v1.
- **Do** make every major dashboard module screenshot-friendly with title, range, legend, data, takeaway, and attribution.
- **Do** use tooltips/help popovers for methodology details instead of bloating the main UI with explanatory text.
- **Do** show confidence as simple labels (`baja`, `media`, `alta`) with tap/hover explanation.
- **Do** distinguish line identity colors from heat-state colors.
- **Do** use subtle heat shimmer or ember-like motion only around selected heat state or critical dashboard feedback, with reduced-motion alternatives.
- **Do** include the mandatory disclaimer: `Proyecto ciudadano no afiliado a Metro de Madrid.`
- **Do** keep Spanish and English copy complete in v1, with all UI strings in dictionaries.

### Don't:

- **Don't** make the app look affiliated with Metro de Madrid. Do not use official logos, wordmarks, typography mimicry, or exact brand layouts.
- **Don't** build a generic complaint counter that treats raw complaint volume as truth.
- **Don't** lead with a single network average that hides severe lines.
- **Don't** use heavy cartoon fire visuals, full-screen flame backgrounds, novelty heat effects, or decorative flame illustrations.
- **Don't** use glassmorphism as a default surface treatment.
- **Don't** use border radii above 16px on cards, panels, or inputs.
- **Don't** combine a 1px card border with soft shadows above 8px blur.
- **Don't** use colored side-stripe borders thicker than 1px on cards, list items, alerts, or callouts.
- **Don't** use gradient text, decorative grid backgrounds, repeating stripe backgrounds, or tiny uppercase tracked eyebrows as section scaffolding.
- **Don't** expose open free-text comments in v1.
- **Don't** request GPS/location permission in v1.
- **Don't** support offline submission in v1.
- **Don't** hide line/car/fleet caveats when the metric is estimated or based on partial data.
