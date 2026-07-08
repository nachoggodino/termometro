#!/usr/bin/env python3
"""Generate reviewed Termo report insert SQL from CSV input."""

from __future__ import annotations

import argparse
import csv
import io
import random
import re
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


MINUTE_CHOICES = [3, 6, 9, 11, 14, 17, 18, 21, 23, 27, 31, 34, 38, 43, 47, 49, 52, 56]
CAR_RE = re.compile(r"^[A-Z][0-9]{4,5}$")


@dataclass(frozen=True)
class ReportRow:
    created_at: str
    line: str
    car: str
    state: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Termo report preview and insert SQL from CSV.")
    parser.add_argument("--input", "-i", help="CSV file path. Reads stdin when omitted.")
    parser.add_argument("--seed", type=int, default=20260708, help="Random seed for minute and state assignment.")
    parser.add_argument("--calor-ratio", type=float, default=0.30, help="Fraction of rows to mark calor.")
    parser.add_argument("--source", default="manual launch insert", help="Source label for car upserts.")
    parser.add_argument("--preview-only", action="store_true", help="Print only preview SQL.")
    parser.add_argument("--insert-only", action="store_true", help="Print only insert SQL.")
    parser.add_argument("--force-randomize-all-minutes", action="store_true", help="Randomize minutes even when input has non-zero minutes.")
    return parser.parse_args()


def read_text(input_path: str | None) -> str:
    if input_path:
        return Path(input_path).read_text(encoding="utf-8-sig")
    return sys.stdin.read()


def sniff_dialect(text: str) -> csv.Dialect:
    sample = "\n".join(text.splitlines()[:5])
    try:
        return csv.Sniffer().sniff(sample, delimiters=";,")
    except csv.Error:
        return csv.excel


def normalize_header(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")


def normalize_line(value: str) -> str | None:
    token = value.strip().upper().replace("?", "")
    if token in {str(i) for i in range(1, 13)}:
        return f"L{token}"
    if token.startswith("L") and token[1:] in {str(i) for i in range(1, 13)}:
        return token
    return None


def normalize_car(value: str) -> str | None:
    token = re.sub(r"[^A-Z0-9]", "", value.strip().upper())
    return token if CAR_RE.fullmatch(token) else None


def parse_datetime(value: str) -> datetime:
    return datetime.strptime(value.strip(), "%Y-%m-%d %H:%M")


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def read_csv_rows(text: str) -> list[dict[str, str]]:
    dialect = sniff_dialect(text)
    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    if not reader.fieldnames:
        raise SystemExit("CSV must include a header row.")
    normalized_names = {name: normalize_header(name) for name in reader.fieldnames}
    rows = []
    for raw in reader:
        rows.append({normalized_names[key]: (value or "") for key, value in raw.items() if key is not None})
    return rows


def pick_column(row: dict[str, str], candidates: list[str]) -> str:
    for candidate in candidates:
        if candidate in row:
            return row[candidate]
    raise SystemExit(f"Missing required column. Expected one of: {', '.join(candidates)}")


def build_reports(text: str, seed: int, calor_ratio: float, force_randomize_all_minutes: bool) -> list[ReportRow]:
    rng = random.Random(seed)
    parsed = []
    used_datetimes = set()

    for index, row in enumerate(read_csv_rows(text), start=1):
        raw_created_at = pick_column(row, ["fecha_hora_aprox", "created_at", "fecha", "datetime"])
        raw_line = pick_column(row, ["linea_de_metro", "linea", "line", "metro_line"])
        raw_car = pick_column(row, ["vagon", "car", "coche"])

        line = normalize_line(raw_line)
        car = normalize_car(raw_car)
        if not line:
            raise SystemExit(f"Row {index}: invalid line {raw_line!r}")
        if not car:
            raise SystemExit(f"Row {index}: invalid car {raw_car!r}")

        dt = parse_datetime(raw_created_at)
        if force_randomize_all_minutes or dt.minute == 0:
            minute = rng.choice(MINUTE_CHOICES)
            while dt.replace(minute=minute) in used_datetimes:
                minute = rng.randint(1, 59)
            dt = dt.replace(minute=minute)
        used_datetimes.add(dt)
        parsed.append((dt.strftime("%Y-%m-%d %H:%M"), line, car))

    calor_count = round(len(parsed) * calor_ratio)
    calor_indexes = set(rng.sample(range(len(parsed)), calor_count)) if calor_count else set()
    return [
        ReportRow(created_at=created_at, line=line, car=car, state="calor" if index in calor_indexes else "infierno")
        for index, (created_at, line, car) in enumerate(parsed)
    ]


def values_sql(rows: list[ReportRow]) -> str:
    return ",\n".join(
        "    "
        + f"({sql_quote(row.created_at)}::timestamp at time zone 'Europe/Madrid', "
        + f"{sql_quote(row.line)}, {sql_quote(row.car)}, {sql_quote(row.state)}::public.heat_state)"
        for row in rows
    )


def timestamp_list_sql(rows: list[ReportRow]) -> str:
    return ", ".join(f"{sql_quote(row.created_at)}::timestamp at time zone 'Europe/Madrid'" for row in rows)


def car_pairs_sql(rows: list[ReportRow]) -> str:
    pairs = sorted({(row.line, row.car) for row in rows})
    return ", ".join(f"({sql_quote(line)}, {sql_quote(car)})" for line, car in pairs)


def preview_sql(rows: list[ReportRow]) -> str:
    return f"""-- Preview first
with new_reports(created_at, line, car, state) as (
  values
{values_sql(rows)}
)
select * from new_reports order by created_at;
"""


def insert_sql(rows: list[ReportRow], source: str) -> str:
    return f"""-- Insert after user approval
begin;

with new_reports(created_at, line, car, state) as (
  values
{values_sql(rows)}
),
inserted_reports as (
  insert into public.reports (line, car, state, created_at, review_status)
  select line, car, state, created_at, 'accepted'
  from new_reports
  returning line, car
)
insert into public.cars (code, line, verified, source)
select distinct car, line, false, {sql_quote(source)}
from inserted_reports
where car is not null
on conflict (code, line) do update set
  active = true,
  source = excluded.source;

commit;
"""


def checks_sql(rows: list[ReportRow]) -> str:
    return f"""-- Collision check before insert
select count(*) as matching_existing_rows
from public.reports
where created_at in ({timestamp_list_sql(rows)});

-- Inserted rows check after insert
select count(*) as inserted_rows,
       count(*) filter (where state = 'calor') as inserted_calor,
       count(*) filter (where state = 'infierno') as inserted_infierno,
       count(*) filter (where extract(minute from created_at at time zone 'Europe/Madrid') = 0) as inserted_minute_zero
from public.reports
where created_at in ({timestamp_list_sql(rows)});

-- Car upsert check after insert
select count(*) as matching_cars
from public.cars
where (line, code) in ({car_pairs_sql(rows)});
"""


def main() -> None:
    args = parse_args()
    if args.preview_only and args.insert_only:
        raise SystemExit("Use only one of --preview-only or --insert-only.")
    rows = build_reports(read_text(args.input), args.seed, args.calor_ratio, args.force_randomize_all_minutes)
    summary = f"-- Summary: {len(rows)} rows, {sum(row.state == 'calor' for row in rows)} calor, {sum(row.state == 'infierno' for row in rows)} infierno\n"

    if args.preview_only:
        print(summary + preview_sql(rows))
    elif args.insert_only:
        print(summary + insert_sql(rows, args.source))
    else:
        print(summary + preview_sql(rows) + "\n" + insert_sql(rows, args.source) + "\n" + checks_sql(rows))


if __name__ == "__main__":
    main()
