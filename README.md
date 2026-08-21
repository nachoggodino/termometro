# Termo de Madrid

Mobile-first civic PWA for reporting and exploring Metro de Madrid AC conditions in train cars and station platforms.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000/es`.

Local development can run without Supabase. In that mode the app uses in-memory seed data from `src/lib/server/seed-data.ts`. Production-like environments require Supabase environment variables and `TERMO_ABUSE_SECRET` unless `TERMO_ALLOW_MEMORY_STORE=1` is set explicitly for a throwaway demo.

## Environment

Copy `.env.example` to `.env.local` when wiring Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SITE_URL=https://termodemadrid.es
SUPABASE_SERVICE_ROLE_KEY=
TERMO_ABUSE_SECRET=
TERMO_ALLOW_MEMORY_STORE=
```

Use a long random value for `TERMO_ABUSE_SECRET`; it salts private abuse-control keys and undo token hashes. Abuse-control fingerprints are kept server-side only and the current write path retains them in a private, self-pruning short-lived store rather than in dashboard-visible report data.

Set `NEXT_PUBLIC_SITE_URL` to `https://termodemadrid.es` in production so social preview metadata uses absolute public URLs.

## Supabase

Apply every pending file in `supabase/migrations/` in filename order before deploying application code that depends on it, then seed optional development data when needed:

```bash
supabase db push --dry-run
supabase db push
```

Optional local seed data lives in `supabase/seed.sql`.

Dashboard, station-catalogue, and car-inventory reads run only on the server with the service-role key. Car codes are stored normalized as one uppercase letter plus 4 or 5 digits, for example `M1234`; the UI may display them as `M-1234`.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:ui
```

GitHub Actions runs this same verification suite, including Playwright on mobile and desktop projects. See `DEPLOYMENT.md` for the deployment order and production checks.
