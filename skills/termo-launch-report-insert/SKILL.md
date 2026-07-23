---
name: termo-launch-report-insert
description: Generate reviewed SQL inserts for Termo de Madrid report CSV data and execute them only after user approval. Use when the user provides semicolon/comma CSV rows with approximate date/time, Metro line, and car, asks for randomized minutes, a random calor/infierno split such as 30% calor, preview SQL, or asks to insert approved launch/manual report data into Supabase production.
---

# Termo Launch Report Insert

## Workflow

Use this for ad hoc Termo report imports after launch.

1. Parse user CSV with columns equivalent to `fecha_hora_aprox`, `linea_de_metro`, and `vagon`.
2. Normalize the input cars and lines locally, then check every unique input car against Supabase production before generating final SQL.
3. Build a verified car-line mapping from the database. If a submitted car belongs to a different verified line than the input row says, correct the generated report to the database-verified line.
4. Generate SQL with `scripts/csv_to_report_insert_sql.py` using `--verified-cars`. Do not use `--require-verified-cars` for launch imports unless the user explicitly asks to block on missing verified cars.
5. Show the generated SQL to the user for inspection, including the SQL comment block that lists car-line corrections, unverified cars, and skipped rows. Do not execute yet.
6. Wait for an explicit approval such as "GO", "execute", or "insert it".
7. Before executing, run a pre-check against Supabase production for total counts and exact timestamp collisions.
8. Execute the insert in a transaction.
9. Run post-checks for total delta, inserted row count, calor/infierno split, minute-zero count, and car upserts.

## Defaults

- Project ID: `faddyyzqsbxgpaoyphzy` (`termometro`).
- Normalize lines as `L1` through `L12`.
- Normalize cars by removing punctuation and uppercasing, e.g. `M-2734` -> `M2734`.
- Treat Supabase's verified car-line mapping as authoritative. Do not trust an input line when the input car has a different verified line in the database.
- If a car has no verified database line but the input row has an explicit valid line, keep the report with that input line and upsert the car as `verified = false`.
- If both the input line is unknown/invalid and the car has no verified database line, skip that row and report it in the SQL comment block instead of guessing.
- Use `Europe/Madrid` for timestamp conversion.
- Randomize only rows whose input minute is `00`; preserve non-zero minutes unless the user says otherwise.
- Assign `round(row_count * calor_ratio)` rows to `calor`; all remaining rows are `infierno`.
- Default calor ratio is `0.30`.
- Use hardcoded generated timestamps and states in the SQL; do not use SQL `random()`.
- Insert into `public.reports` with `review_status = 'accepted'`.
- Upsert `public.cars` from inserted reports with `source = 'manual launch insert'` unless the user asks for another source.
- Do not create a migration unless the user explicitly asks.

## Generate SQL

Write the input CSV to a temp file. Before generating SQL, query Supabase for all unique normalized input cars and write the verified mapping to a second CSV with columns `car,verified_line`.

The database query must use only authoritative verified mappings. Do not choose between duplicate unverified `public.cars` rows by guesswork. If a car has conflicting verified lines, stop and ask the user to fix the database or provide an explicit verified mapping. If a car has no verified database line, keep rows that have an explicit valid input line and report those cars as unverified in the generated SQL.

Example Supabase precheck shape:

```sql
with input_cars(car) as (
  values
    ('M2728'),
    ('R2155')
),
verified as (
  select c.code as car,
         array_agg(distinct c.line order by c.line) as verified_lines
  from public.cars c
  join input_cars i on i.car = c.code
  where c.active is true
    and c.verified is true
  group by c.code
)
select i.car,
       v.verified_lines,
       case
         when v.verified_lines is null then 'missing'
         when cardinality(v.verified_lines) = 1 then 'ok'
         else 'conflict'
       end as status
from input_cars i
left join verified v using (car)
order by i.car;
```

Continue when every input car is either `ok` or `missing`, and no input car has `conflict`. Export/write the `ok` mapping like:

```csv
car,verified_line
M2728,L5
R2155,L1
```

Then generate SQL:

```bash
python3 skills/termo-launch-report-insert/scripts/csv_to_report_insert_sql.py \
  --input /tmp/reports.csv \
  --verified-cars /tmp/verified-car-lines.csv \
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

Show the preview SQL first. The generated output includes a `-- Car-line verification report` comment block. Report those corrections to the user when showing the SQL. If the user approves, execute the insert SQL from the same generated output.

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
