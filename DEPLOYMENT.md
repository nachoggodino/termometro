# Deployment Readiness

Termo de Madrid is intended to deploy on Vercel with Supabase Postgres.

## Preview Production On Vercel

Use a Vercel Preview deployment first. Keep the production branch private/unpromoted until the preview has been verified.

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Set these Vercel environment variables for Preview and Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
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

## Current Gaps Before Public Production

- Supabase migrations exist, but they still need to be applied and verified against the real project.
- CI is configured in `.github/workflows/ci.yml`; require it as a branch protection check before public launch.
- Playwright coverage exists for core flows, language/theme switching, and undo, but screenshots/accessibility checks should be reviewed before public launch.
- Live Supabase verification is still required for RLS, RPC rate limiting, duplicate suppression, undo, and hidden report filtering.
