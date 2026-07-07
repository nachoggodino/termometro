# Deployment Readiness

Termometro de Madrid is intended to deploy on Vercel with Supabase Postgres.

## Fake Production On Vercel

Use a Vercel Preview deployment first. Keep the production branch private/unpromoted until the preview has been verified.

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Set these Vercel environment variables for Preview and Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TERMOMETRO_ABUSE_SECRET`
4. Apply all files in `supabase/migrations/` to the Supabase project in filename order.
5. Seed non-production data with `supabase/seed.sql` if the preview project should have dashboard data immediately.
6. Deploy a Preview build from a non-production branch.
7. Verify the preview:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run test:ui`

Vercel sets `VERCEL=1`, so the app will fail loudly if Supabase env vars or `TERMOMETRO_ABUSE_SECRET` are missing instead of falling back to local seed data.

## Current Gaps Before Public Production

- Supabase migrations exist, but they still need to be applied and verified against the real project.
- CI is not configured yet. Vercel can build from Git, but test/typecheck gates are still manual.
- Playwright coverage exists for core flows, language/theme switching, and undo, but screenshots/accessibility checks should be reviewed before public launch.
