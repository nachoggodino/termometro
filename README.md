# Termómetro de Madrid

Mobile-first civic PWA for reporting and exploring Metro de Madrid AC conditions.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000/es`.

Local development can run without Supabase. In that mode the app uses in-memory seed data from `src/lib/server/seed-data.ts`. Vercel Preview/Production requires Supabase environment variables and `TERMOMETRO_ABUSE_SECRET`.

## Environment

Copy `.env.example` to `.env.local` when wiring Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TERMOMETRO_ABUSE_SECRET=
```

Use a long random value for `TERMOMETRO_ABUSE_SECRET`; it salts private abuse keys and undo token hashes.

## Supabase

When you create the Supabase project, apply migrations in order, then seed optional development data:

```bash
supabase/migrations/0001_initial.sql
supabase/migrations/0002_create_report_rpc.sql
supabase/seed.sql
```

Car codes are stored normalized as one uppercase letter plus 4 or 5 digits, for example `M1234`. The UI may display them as `M-1234`.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:ui
```

See `DEPLOYMENT.md` for Vercel Preview setup.
