# Deployment Readiness

Termo de Madrid deploys on Vercel with Supabase Postgres.

## Required environment

Set these variables in the Vercel Preview and Production environments:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SITE_URL=https://termodemadrid.es`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TERMO_ABUSE_SECRET`

The app fails loudly in production-like environments if Supabase configuration or `TERMO_ABUSE_SECRET` is missing. `TERMO_ALLOW_MEMORY_STORE=1` exists only for throwaway demos and must not be enabled in public production.

## Deployment order

Database migrations are part of the application contract. Always inspect and apply pending migrations before deploying application code that calls new RPCs.

1. Fetch the exact application commit to release.
2. Review pending database changes:

   ```bash
   supabase db push --dry-run
   ```

3. Verify a recoverable database backup exists before any non-trivial schema/RPC migration.
4. Apply the pending migrations in filename order:

   ```bash
   supabase db push
   ```

5. Deploy the same commit to Vercel Preview.
6. Verify the Preview against the migrated database.
7. Confirm GitHub Actions is green for the release commit:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
   - `npm run test:ui`
8. Promote/release only after the database and Preview checks pass.

For the platform-report hardening introduced on `feature-report-platforms`, `20260821201000_harden_platform_reporting.sql` must be applied before deploying the application commit that uses `create_report_v3` and `dashboard_platform_history_v1`.

## Migration compatibility

Platform migrations preserve the legacy car-report and dashboard RPC contracts so a database-first rollout remains compatible with the preceding application version. New application code uses versioned RPCs rather than rewriting the legacy entry points in place.

The hardening migration is additive apart from replacing the existing private car-fact synchronization trigger with a location-aware implementation. It also:

- adds a supporting `(line, station_id)` index;
- exposes platform history from the private hourly fact table;
- moves new abuse fingerprints into a private short-lived event table;
- adds a network-level abuse ceiling in addition to the existing per-origin limit;
- clears legacy report-row abuse hashes after their abuse-control window.

Do not deploy the new application before this migration: report creation and platform drill-down depend on its versioned RPCs.

## Production verification

After release, verify at minimum:

- car report submission, duplicate handling, rate limiting, and undo;
- platform report submission with canonical station validation;
- a platform report does not affect car/fleet/Termo calculations;
- Home recent reports and network-wide volume include platform reports;
- platform explorer history and platform coverage render correctly;
- hidden/undone reports disappear from user-visible data;
- no anonymous/authenticated role can execute service-only RPCs or read private fact/abuse tables;
- database CPU, locks, error rate, and report-submission latency remain normal.

## CI and repository controls

`.github/workflows/ci.yml` runs lint, typecheck, unit tests with coverage, production build, and Playwright E2E/visual checks on every branch push and pull request.

The release branch should require the CI check through GitHub branch protection. This is repository configuration rather than application code and should be verified separately from a feature-branch deployment.
