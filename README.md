# Termo de Madrid

Mobile-first civic PWA for reporting and exploring Metro de Madrid AC conditions.

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TERMO_ABUSE_SECRET=
TERMO_ALLOW_MEMORY_STORE=
```

Use a long random value for `TERMO_ABUSE_SECRET`; it salts private abuse keys and undo token hashes.

## Supabase

When you create the Supabase project, apply every file in `supabase/migrations/` in filename order, then seed optional development data:

```bash
supabase/migrations/*.sql
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

The same verification suite runs in GitHub Actions. See `DEPLOYMENT.md` for Vercel Preview setup.
