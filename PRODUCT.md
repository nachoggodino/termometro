# Product

## Register

product

## Users

Termo de Madrid is for Metro de Madrid riders, primarily on mobile phones, who want to report and understand overheated train cars caused by weak or broken air conditioning. Users are often in transit, uncomfortable, and short on patience, so reporting must be fast, anonymous, and low-friction.

Secondary users include journalists, transit advocates, public officials, and people sharing evidence on social media. For them, the dashboard should make the scale and concentration of the problem legible without hiding severe lines behind network-wide averages.

## Product Purpose

Termo de Madrid is a citizen-run, multilingual PWA that collects crowdsourced AC condition reports for Metro de Madrid lines and cars. It exists to make heat problems visible, shareable, and harder to ignore.

The product has two primary actions:

- Reportar: submit a current AC condition report with line, heat state, and optional car identifier.
- Explorar: browse charts, tables, confidence indicators, car/line detail, and shareable evidence cards.

Reports use three states:

- Fresco: the car feels comfortable and the AC is working.
- Calor: the car is uncomfortably warm or AC is weak.
- Infierno: the car feels intolerable or the AC appears broken.

Reports are evidence, not absolute truth. Dashboards should show recency, confidence, disagreement, and fleet coverage caveats. The product should emphasize known pain points like L1 and L5 when the data supports it, without hardcoding conclusions as facts.

Success means people can submit a report in seconds, understand the heat situation at a glance, and share clear visual evidence that pressures the system to improve.

## Brand Personality

Sharp, civic, restrained, and lightly satirical.

The product can use dry humor and heat metaphors, especially in state descriptions, summaries, empty states, and share cards. Core navigation, form labels, data labels, validation, and methodology must remain clear and credible. The app should feel like a serious public evidence tool with a memorable edge, not a parody or novelty site.

Public-facing name:

- Spanish UI: Termo de Madrid, displayed as Termo de Madrid.
- Short name: Termo.
- Technical names, slugs, package names, and code identifiers should use ASCII: termo.

## Anti-references

The product must not look affiliated with Metro de Madrid. It may use Metro line colors for line identity, but should avoid official logos, typography mimicry, brand layouts, and anything that could imply endorsement. A small disclaimer is mandatory: Proyecto ciudadano no afiliado a Metro de Madrid.

Avoid:

- A generic complaint counter that treats raw complaint volume as truth.
- A dashboard that averages all lines into a harmless-looking network score.
- Heavy cartoon fire visuals, full-screen flame backgrounds, or novelty heat effects.
- A marketing-heavy landing page that delays the two main actions.
- Open free-text comments in v1, because they increase moderation and abuse risk.
- GPS/location permission in v1, because it adds friction and is unreliable underground.
- Offline submission in v1, because reports must represent current conditions.
- Login, accounts, profiles, or public user identities.

## Design Principles

1. Make the hot lines impossible to average away.
   The dashboard may lead with a current evolution/status module, but it must keep rankings, line-by-line comparisons, critical-line callouts, and worst-car evidence prominent instead of using a single network average.

2. Treat reports as signals, not verdicts.
   Use recency, confidence, disagreement, and sample size to communicate uncertainty honestly.

3. Keep reporting fast enough for a crowded train.
   Default to L1 and Calor, require only the essential fields, make car optional, and avoid dates, comments, accounts, and location prompts.

4. Make evidence shareable from mobile.
   Dashboard modules should be screenshot-friendly, and key charts should support share/export cards with title, range, chart, key stat, and attribution.

5. Satire supports the mission; clarity wins the task.
   Use wit in supporting copy and summaries, but keep controls, labels, and data interpretation precise.

6. Be honest about civic data.
   Clearly label estimated fleet metrics, partial car inventories, confidence levels, and the citizen-run nature of the project.

## Accessibility & Inclusion

The app should target WCAG AA. It must be mobile-first, keyboard-accessible, screen-reader-friendly, and readable in bright outdoor light or inside trains.

Specific requirements:

- Do not rely on color alone for line or status selection.
- Provide visible focus states and accessible selected states.
- Support reduced motion for heat shimmer, ember-like effects, and transitions.
- Ensure text contrast meets accessibility requirements, including helper and placeholder text.
- Use Spanish and English in v1, with infrastructure ready for additional locales such as Catalan, Basque, French, and Arabic.
- Keep Spanish route slugs stable across locales, such as /es/reportar and /en/reportar.
- Prepare for future RTL support before Arabic is exposed.

## Data Trust & Abuse Controls

Reports are anonymous publicly. The system may store short-lived private technical abuse keys derived server-side for rate limiting and duplicate suppression, but must not expose user identifiers in dashboards.

V1 abuse controls:

- Server timestamp only; no backdating field.
- Open anonymous submission without accounts.
- Client and server validation.
- Rate limiting by private abuse key.
- Soft duplicate suppression for repeated line/car/status reports in a short window. Reports without a car identifier are not globally suppressed as duplicates, because many riders can truthfully report the same line/status at once.
- Friendly duplicate feedback such as "Ya hemos contado este reporte hace un momento."
- Short undo window after submission, dismissible by the user.
- Moderation fields in the database, but no admin UI in v1.

Users should be reminded lightly near submission to report only what they are experiencing now. The methodology page should explain that false reports weaken the pressure for real improvements.

## Core Product Scope

V1 routes:

- Home: compact civic landing with title, mission sentence, two visible actions, live snapshot, and disclaimer.
- /reportar: dedicated report screen with easy exit, line picker, heat state selector, optional car autocomplete, and success feedback.
- /explorar: dashboard with global line filter, time range controls, charts, confidence indicators, car/line detail, and share cards.
- /metodologia: lightweight methodology, privacy, abuse, confidence, fleet estimates, and affiliation disclaimer.

V1 dashboard modules:

- Line evolution by report volume.
- Total reports by day, including all states, lines, and reports with or without a car identifier.
- Report volume by line and time range.
- Distinct cars reported by line.
- Reports by car series, grouped by the thousand number in the car identifier and sorted by series.
- Worst cars, collapsed to the top 4 by default and expandable to 15.
- Explore car: select an existing reported car and inspect total reports, reported lines, and report history by day/hour for the active range.
- Termo indicator trend over time.
- Distribution by hour from 5 to 23, using one bar per hour and counting reports from `HH:00` through `HH:59`.
- Fleet coverage using known and estimated car counts, collapsed to the 5 worst lines by default and expandable to all lines.
- Line summary cards with confidence, disagreement, latest report, and score.
- Line detail modal from summary cards: show reported cars for the active line/range, total distinct reported cars, per-car report totals, and non-zero Fresco/Calor/Infierno counters. Car rows link into the car explorer.

The Explore page no longer includes the capped recent reports feed as a dashboard module. Recent report data may still be used for Home snapshots and internal calculations.

Time ranges:

- Hoy.
- 7 dias.
- 1 mes.
- Este verano: May 15 to October 15 for the current season, or the most recent completed season before May 15.

Backend and deploy target:

- Supabase Postgres for persistence.
- Next.js App Router with TypeScript for the app.
- Vercel for deployment.
- PWA from v1 with installable shell and cached last dashboard view, but no offline submission.

Local development should include realistic seed data that makes L1 and L5 visibly worse, includes varied car codes, conflicting reports, normal reports on other lines, and dashboard-ready history.
