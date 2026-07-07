# Agent Instructions

This repository is for **Termo de Madrid**, a mobile-first civic PWA for reporting and exploring Metro de Madrid AC conditions.

Before making product, UI, data, or architecture changes, read:

- `PRODUCT.md`
- `DESIGN.md`

Those files are project constraints, not background notes. Do not contradict them without explicitly updating them.

## Product Rules

- The app is Spanish-first and English-complete in v1. Do not hardcode user-facing strings in components. Put copy in locale dictionaries.
- Keep route slugs stable across locales: `/es/reportar`, `/en/reportar`, `/es/explorar`, `/en/explorar`.
- The public UI must not imply affiliation with Metro de Madrid. Always preserve the disclaimer: `Proyecto ciudadano no afiliado a Metro de Madrid`
- Reports are anonymous publicly. Do not expose IPs, device hashes, user agents, or technical abuse keys.
- Do not add accounts, GPS prompts, open text comments, backdating, or offline submission unless `PRODUCT.md` is intentionally revised first.
- Treat reports as signals, not truth. Dashboards must show confidence, recency, disagreement, and estimated-fleet caveats where relevant.
- Do not lead dashboards with a single network average that hides critical lines.

## Design Rules

- Follow `DESIGN.md` tokens and component rules. If a new style is needed, add a token or documented component variant first.
- Use OKLCH for project color tokens.
- Do not hardcode colors, spacing, radii, z-index values, animation durations, or typography values inside components. Extract them to tokens, constants, theme config, or component variants.
- Use 8px cards/controls by default; 12px only for larger panels/share cards; never exceed 16px radii for cards, panels, or inputs.
- Do not use glassmorphism, gradient text, decorative grid backgrounds, stripe backgrounds, cartoon flames, or large warm-tinted page backgrounds.
- Metro line colors identify lines. Heat colors encode `Fresco`, `Calor`, and `Infierno`. Do not mix those meanings.
- `Infierno` must not be visually baited before selection. Heat state options stay equal weight until selected.
- Motion must convey state, prefer 150-250ms transitions for controls, allow longer structural drawer transitions when they improve spatial clarity, and support `prefers-reduced-motion`.
- All interactive states need default, hover, focus, active, disabled, loading/error where applicable.
- Use tooltips/help popovers for methodology details instead of bloating primary UI text.

## Code Organization

- Prefer small, typed modules with clear ownership.
- Extract shared constants for Metro lines, heat states, time ranges, routes, locale keys, chart options, validation limits, and duplicate windows.
- Do not duplicate scoring, confidence, date-range, validation, or normalization logic across UI, API routes, and tests. Put shared domain logic in a reusable module.
- Keep Supabase access behind server-side helpers/repositories. Client components should not contain raw database query logic for mutations.
- Initialize service clients lazily, not at module scope, when environment variables are required.
- Keep chart implementations behind app-owned abstractions such as `ChartCard`, `ShareableModule`, and specific chart components. Recharts is the v1 chart library, but do not spread raw chart configuration everywhere.
- Do not put large business logic inside React components. Components compose state and presentation; domain modules compute.

## Data And Backend Rules

- Use Supabase Postgres from the beginning, including local development and seed data.
- Schema changes must be represented as migrations once the project is scaffolded.
- Enable RLS on exposed tables and keep public write access constrained through server-side validation/rate limiting.
- Store server timestamps for reports. Do not trust client timestamps for report creation.
- Rate limiting and duplicate suppression should use short-lived private abuse keys only.
- Include moderation fields in the schema even if no admin UI exists in v1.
- Seed data must be realistic and dashboard-ready, with L1 and L5 visibly worse, varied cars, conflicting reports, and normal reports on other lines.

## Testing And Verification

- Target at least 90% coverage for domain logic plus shared app helpers such as i18n and server security. Broaden component/page coverage incrementally as harnesses are added; if a file cannot reasonably meet this, document why in the PR/summary.
- Test domain logic thoroughly: heat scoring, confidence, disagreement, time ranges, duplicate suppression, validation, i18n lookup, and car normalization.
- Add component or Playwright tests for important UI states: selected line, selected heat state, validation errors, loading, success, duplicate feedback, undo toast, empty dashboard, and dark mode.
- Use Playwright for every user-facing feature flow: home actions, report submission, undo submission, explore filters, language switch, theme switch, dashboard chart rendering, and mobile viewport behavior.
- Capture and review Playwright screenshots for mobile and desktop before calling UI work complete.
- At the end of UI-facing development sessions, make the local dev server reachable from a real phone when practical, report the exact phone URL, and document any firewall, WSL, or network limitation if phone access cannot be verified.
- Check accessibility with automated tooling where available and manual keyboard traversal for core flows.
- Verify chart performance on mobile-sized viewports. If animations cause jank, reduce or disable them.
- Do not mark work complete while tests, typecheck, lint, or Playwright verification are failing unless the failure is explicitly documented as unrelated and pre-existing.

## Review Checklist

Before finalizing a change, review:

- No user-facing hardcoded strings outside locale dictionaries.
- No un-tokenized colors, radii, spacing, z-index, animation duration, or chart colors.
- No duplicated domain logic.
- No accidental Metro affiliation signals.
- No hidden accessibility regressions: contrast, focus, labels, reduced motion, keyboard navigation.
- No dashboard average that hides line-level severity.
- No unbounded public data exposure.
- Tests and screenshots cover the changed behavior.

## Documentation

- Update `PRODUCT.md` when product scope or policy changes.
- Update `DESIGN.md` when visual tokens, component vocabulary, motion rules, or chart language change.
- Update this file when implementation discipline changes.
