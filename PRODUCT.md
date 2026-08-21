# Product

## Register

product

## Users

Termo de Madrid is for Metro de Madrid riders, primarily on mobile phones, who want to report and understand excessive heat in train cars and on station platforms. Users are often in transit, uncomfortable, and short on patience, so reporting must be fast, anonymous, and low-friction.

Secondary users include journalists, transit advocates, public officials, and people sharing evidence on social media. For them, the dashboard should make the scale and concentration of the problem legible without hiding severe lines, cars, or platforms behind network-wide averages.

## Product Purpose

Termo de Madrid is a citizen-run, multilingual PWA that collects crowdsourced heat-condition reports for Metro de Madrid lines, train cars, and platforms. It exists to make heat problems visible, shareable, and harder to ignore.

The product has two primary actions:

- Reportar: submit a current heat report for a selected line and either a train car or a station platform.
- Explorar: browse report-volume evidence, confidence indicators, car/platform rankings, line detail, and shareable evidence cards.

Reports use three states:

- Fresco: the current environment feels comfortable.
- Calor: the current environment is uncomfortably warm.
- Infierno: the current environment feels intolerable.

Reports are evidence, not absolute truth. Dashboards should show recency, confidence, disagreement, and fleet caveats where those concepts apply.

## Report locations

Every report has an explicit location kind:

- `car`: identifies a train-car experience. The car identifier is optional.
- `platform`: identifies a platform by the combination of Metro line and station. A station is required and must belong to the selected line.

A station interchange therefore represents one separate report location per line. For example, Sol on L1 and Sol on L3 are distinct platform-report locations. Direction is not modeled. In the platform explorer, locations with the same station identity are grouped for selection and their history can be aggregated across the reported lines allowed by the active line filter.

Legacy report payloads that omit the location kind are interpreted as `car` reports.

The station catalogue is a closed vocabulary sourced from current CRTM Metro station information. The current product scope is L1-L12; Ramal is intentionally outside this scope. Application and database catalogues must remain entry-for-entry equivalent.

## Brand Personality

Sharp, civic, restrained, and lightly satirical.

The product can use dry humor and heat metaphors, especially in state descriptions, summaries, empty states, and share cards. Core navigation, form labels, data labels, validation, and methodology must remain clear and credible. The app should feel like a serious public evidence tool with a memorable edge, not a parody or novelty site.

Public-facing name:

- Spanish UI: Termo de Madrid.
- Short name: Termo.
- Technical names, slugs, package names, and code identifiers use ASCII: `termo`.

## Anti-references

The product must not look affiliated with Metro de Madrid. It may use Metro line colors for line identity, but should avoid official logos, typography mimicry, brand layouts, and anything that could imply endorsement. A small disclaimer is mandatory: Proyecto ciudadano no afiliado a Metro de Madrid.

Avoid:

- A generic complaint counter that treats raw complaint volume as truth.
- A dashboard that averages all lines into a harmless-looking network score.
- Mixing platform reports into car-fleet coverage or the fleet-adjusted Termo indicator.
- Heavy cartoon fire visuals, full-screen flame backgrounds, or novelty heat effects.
- A marketing-heavy landing page that delays the two main actions.
- Open free-text comments in v1.
- GPS/location permission in v1.
- Offline submission in v1.
- Login, accounts, profiles, or public user identities.

## Design Principles

1. Make concentrated heat problems impossible to average away.
   Keep line comparisons, worst-car evidence, and worst-platform evidence prominent instead of relying on a single network average.

2. Treat reports as signals, not verdicts.
   Use recency, confidence, disagreement, and sample size where meaningful.

3. Keep reporting fast enough for a crowded train or platform.
   Default to L1, Calor, and car mode. The location switch should be an immediately understandable `Coche | Andén` segmented control. Car reports retain the optional car field and missing-car confirmation. Platform reports use a fast station autocomplete restricted to the selected line.

4. Make evidence shareable from mobile.
   Dashboard modules should be screenshot-friendly, with share/export cards where appropriate.

5. Satire supports the mission; clarity wins the task.
   Use wit in supporting copy and summaries, but keep controls, labels, and data interpretation precise.

6. Be honest about civic data.
   Clearly label estimated fleet metrics, partial car inventories, confidence levels, and the citizen-run nature of the project.

## Accessibility & Inclusion

The app should target WCAG AA. It must be mobile-first, keyboard-accessible, screen-reader-friendly, and readable in bright outdoor light or inside trains.

Specific requirements:

- Do not rely on color alone for line or status selection.
- Provide visible focus states and accessible selected states.
- The car/platform control must expose an accessible selected state.
- Station autocomplete must expose combobox/listbox semantics and support keyboard selection.
- Support reduced motion for heat effects and transitions.
- Ensure text contrast meets accessibility requirements.
- Use Spanish and English in v1.
- Keep Spanish route slugs stable across locales, such as `/es/reportar` and `/en/reportar`.

## Data Trust & Abuse Controls

Reports are anonymous publicly. Abuse-control fingerprints are derived server-side with a secret and are never exposed in dashboards. The current write path stores these fingerprints only in a private, self-pruning short-lived event store; they are not persisted on new public report rows.

V1 abuse controls:

- Server timestamp only; no backdating field.
- Open anonymous submission without accounts.
- Client and server validation from the same domain constraints.
- Car identifiers keep the existing line/series validation rules; reports without a car identifier remain allowed.
- Platform reports accept only a canonical station on the selected line.
- The normal per-origin rate limit is shared across car and platform reports.
- A higher network-level ceiling prevents simple User-Agent rotation from creating unlimited quota while reducing false positives on shared networks.
- Known-car duplicates are suppressed when line, car, and state match inside the duplicate window.
- Unidentified car reports keep the existing same-line duplicate rule and per-origin 30-minute suppression.
- Platform duplicates are suppressed when line, station, and state match inside the duplicate window.
- Platform reports must never be treated as unidentified-car reports.
- Friendly duplicate feedback.
- Short undo window after submission.
- Moderation fields remain in the database, with no admin UI in v1.

## Core Product Scope

V1 routes:

- Home: compact civic landing with title, mission sentence, two visible actions, live snapshot, and disclaimer.
- `/reportar`: line picker, heat selector, `Coche | Andén` location control, optional car input or required station autocomplete, and success feedback.
- `/explorar`: dashboard with line, car-series, location-mode, and time-range controls, charts, confidence indicators, car/platform evidence, and line detail.
- `/metodologia`: methodology, privacy, abuse controls, confidence, fleet estimates, and affiliation disclaimer.

### Dashboard inclusion rules

Platform reports are included in network-wide report-volume evidence when no car-series filter is active:

- Home 24-hour report count.
- Home recent reports.
- Total reports by day.
- Line evolution by report count.
- Distribution by hour.

Car/fleet-specific modules remain car-only:

- Report volume and distinct identified cars by line.
- Reports by car series.
- Worst cars.
- Car explorer.
- Fleet coverage.
- Per-line car detail.
- The fleet-adjusted Termo heat index and its trend.

When a car-series filter is active, the shared report-volume charts become series-specific and therefore exclude platform reports. Platform mode has no car-series filter; its modules honor the selected time range and Metro lines.

### Dashboard modules

Shared report-volume context:

- Line evolution by report volume.
- Total reports by day.

Car mode:

- Report volume and distinct identified cars by line.
- Reports by car series.
- Worst cars.
- Explore car.
- Termo indicator trend over time, based only on car reports.
- Distribution by hour from 5 to 23; without a series filter this is network-wide report volume.
- Fleet coverage, based only on identified car reports.
- Line car-detail cards/modal.

Platform mode:

- Platforms with the most heat reports, identified as `Station · Line` and ranked by `Calor + Infierno`, then severity/recency.
- Explore platform: select a reported station and view its report history across its reported lines subject to the active line filter.
- Percentage of platforms without AC by line. A platform has this signal when `Calor + Infierno - Fresco` is greater than the shared platform threshold; the percentage denominator is the canonical station count for that line.

The Explore page does not include the recent reports feed as a dashboard module. Recent report data remains on Home.

Time ranges:

- Hoy.
- 7 días.
- 1 mes.
- Este verano: May 15 to October 15 for the current season, or the most recent completed season before May 15.

Backend and deploy target:

- Supabase Postgres for persistence.
- Next.js App Router with TypeScript.
- Vercel.
- PWA from v1 with cached shell/dashboard view, but no offline submission.

Local development should include realistic train-car seed data. Platform reporting and platform-mode empty states must also work correctly in memory fallback even when local seed data has no platform reports.
