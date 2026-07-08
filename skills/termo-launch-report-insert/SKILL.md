---
name: termo-launch-report-insert
description: Generate reviewed SQL inserts for Termo de Madrid report CSV data and execute them only after user approval. Use when the user provides semicolon/comma CSV rows with approximate date/time, Metro line, and car, asks for randomized minutes, a random calor/infierno split such as 30% calor, preview SQL, or asks to insert approved launch/manual report data into Supabase production.
---

# Termo Launch Report Insert

## Workflow

Use this for ad hoc Termo report imports after launch.

1. Parse user CSV with columns equivalent to `fecha_hora_aprox`, `linea_de_metro`, and `vagon`.
2. Generate SQL with `scripts/csv_to_report_insert_sql.py`.
3. Show the generated SQL to the user for inspection. Do not execute yet.
4. Wait for an explicit approval such as "GO", "execute", or "insert it".
5. Before executing, run a pre-check against Supabase production for total counts and exact timestamp collisions.
6. Execute the insert in a transaction.
7. Run post-checks for total delta, inserted row count, calor/infierno split, minute-zero count, and car upserts.

## Defaults

- Project ID: `faddyyzqsbxgpaoyphzy` (`termometro`).
- Normalize lines as `L1` through `L12`.
- Normalize cars by removing punctuation and uppercasing, e.g. `M-2734` -> `M2734`.
- Use `Europe/Madrid` for timestamp conversion.
- Randomize only rows whose input minute is `00`; preserve non-zero minutes unless the user says otherwise.
- Assign `round(row_count * calor_ratio)` rows to `calor`; all remaining rows are `infierno`.
- Default calor ratio is `0.30`.
- Use hardcoded generated timestamps and states in the SQL; do not use SQL `random()`.
- Insert into `public.reports` with `review_status = 'accepted'`.
- Upsert `public.cars` from inserted reports with `source = 'manual launch insert'` unless the user asks for another source.
- Do not create a migration unless the user explicitly asks.

## Generate SQL

Write the CSV to a temp file or pipe it through stdin:

```bash
python3 skills/termo-launch-report-insert/scripts/csv_to_report_insert_sql.py \
  --input /tmp/reports.csv \
  --seed 20260708 \
  --source "manual launch insert july 8 2026"
```

Useful options:

```bash
--calor-ratio 0.30
--preview-only
--insert-only
--force-randomize-all-minutes
```

Show the preview SQL first. If the user approves, execute the insert SQL from the same generated output.

## Supabase Execution Checks

Before executing:

```sql
select count(*) as total_reports,
       count(*) filter (where state = 'calor') as calor_reports,
       count(*) filter (where state = 'infierno') as infierno_reports
from public.reports;
```

Also check exact timestamp collisions for generated rows. If collisions exist, stop and ask whether to regenerate minutes or insert anyway.

After executing:

```sql
select count(*) as total_reports,
       count(*) filter (where state = 'calor') as calor_reports,
       count(*) filter (where state = 'infierno') as infierno_reports
from public.reports;
```

Verify inserted rows:

```sql
select count(*) as inserted_rows,
       count(*) filter (where state = 'calor') as inserted_calor,
       count(*) filter (where state = 'infierno') as inserted_infierno,
       count(*) filter (where extract(minute from created_at at time zone 'Europe/Madrid') = 0) as inserted_minute_zero
from public.reports
where created_at in (...generated timestamps...);
```

Verify cars:

```sql
select count(*) as matching_cars
from public.cars
where (line, code) in (...generated line/car pairs...);
```

Report the before/after totals and any anomalies.
