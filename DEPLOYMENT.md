# Deployment Readiness

Termo de Madrid is intended to deploy on Vercel with Supabase Postgres.

## Preview Production On Vercel

Use a Vercel Preview deployment first. Keep the production branch private/unpromoted until the preview has been verified.

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Set these Vercel environment variables for Preview and Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SITE_URL=https://termodemadrid.es`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TERMO_ABUSE_SECRET`
4. Apply all files in `supabase/migrations/` to the Supabase project in filename order.
5. Seed non-production data with `supabase/seed.sql` if the preview project should have dashboard data immediately.
6. Deploy a Preview build from a non-production branch.
7. Verify the preview and confirm GitHub Actions passes:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
   - `npm run test:ui`

The app fails loudly in production-like environments if Supabase env vars or `TERMO_ABUSE_SECRET` are missing instead of falling back to local seed data. `TERMO_ALLOW_MEMORY_STORE=1` exists only for throwaway demos and must not be set in public production.

## Database CPU Migration Rollout

The expansion phase consists of two additive migrations. The first creates the empty aggregate path and installs its synchronization trigger; the second backfills it without overwriting groups refreshed by concurrent writes. Both preserve the RPCs, grants, and read policies used by the current production deployment.

1. Confirm that `20260806001521_expand_dashboard_database_cpu.sql` and `20260806093759_backfill_dashboard_database_cpu.sql` are the only pending migrations with `supabase db push --dry-run`.
2. Verify both migrations against a recent production-like database copy and confirm that a recoverable database backup exists.
3. Apply them during a low-traffic window while watching database CPU, locks, errors, and report submission latency.
4. Confirm both migrations are applied and compare representative V2 RPC results with the current dashboard RPCs before deploying the application.
5. Deploy and verify the Vercel Preview against the migrated database.
6. Release the verified commit to production and monitor it for at least 24 hours.
7. After the rollback window, move `supabase/deferred-migrations/cleanup_dashboard_database_cpu.sql` into `supabase/migrations/` using a new CLI-generated migration filename, then review and apply it separately.

The setup migration only takes a brief metadata lock on `reports`; it does not rewrite that table. The backfill reads `reports` and writes the new private table without blocking normal report writes, though it can temporarily consume database CPU. If setup succeeds but backfill fails, keep the current application deployed, diagnose the failure, and retry before deploying the new code.

The cleanup file is deliberately outside the executable migrations directory because `supabase db push` applies every pending migration. The application requires both expansion files, but the current production deployment remains compatible after they are applied. Until cleanup, rolling Vercel back is safe. After cleanup, restore the old database interface before rolling back to the old application.

## Current Gaps Before Public Production

- Supabase migrations exist, but they still need to be applied and verified against the real project.
- CI is configured in `.github/workflows/ci.yml`; require it as a branch protection check before public launch.
- Playwright coverage exists for core flows, language/theme switching, and undo, but screenshots/accessibility checks should be reviewed before public launch.
- Live Supabase verification is still required for RLS, RPC rate limiting, duplicate suppression, undo, and hidden report filtering.
