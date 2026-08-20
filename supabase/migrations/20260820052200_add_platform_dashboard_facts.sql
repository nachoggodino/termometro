create or replace function private.refresh_dashboard_report_hour(
input_created_at timestamptz,
input_line text,
input_car text,
input_state public.heat_state
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
target_hour timestamptz := pg_catalog.date_trunc('hour', input_created_at);
target_car_key text := coalesce(input_car, '');
begin
delete from private.dashboard_report_hourly
where hour_start = target_hour
and line = input_line
and car_key = target_car_key
and state = input_state;
insert into private.dashboard_report_hourly (
hour_start, line, car_key, car_series, state, report_count, decay_weight_sum, latest_report_at
)
select
target_hour,
reports.line,
target_car_key,
case
when reports.car is null or reports.car !~ '[0-9]+' then null
else (substring(reports.car from '[0-9]+')::integer / 1000) * 1000
end,
reports.state,
pg_catalog.count(*)::integer,
pg_catalog.sum(pg_catalog.power(2.0, extract(epoch from (reports.created_at - timestamptz '2020-01-01 00:00:00+00')) / 259200.0)),
pg_catalog.max(reports.created_at)
from public.reports
where reports.hidden_at is null
and reports.location_kind = 'car'
and reports.created_at >= target_hour
and reports.created_at < target_hour + interval '1 hour'
and reports.line = input_line
and reports.car is not distinct from input_car
and reports.state = input_state
group by reports.line, reports.car, reports.state;
end;
$$;
revoke all on function private.refresh_dashboard_report_hour(timestamptz, text, text, public.heat_state) from public, anon, authenticated;
create table if not exists private.dashboard_platform_report_hourly (
hour_start timestamptz not null,
line text not null,
station_id text not null,
state public.heat_state not null,
report_count integer not null check (report_count > 0),
latest_report_at timestamptz not null,
primary key (hour_start, line, station_id, state)
);
alter table private.dashboard_platform_report_hourly enable row level security;
create index if not exists dashboard_platform_report_hourly_filters_idx
on private.dashboard_platform_report_hourly (hour_start, line, station_id);
grant select on private.dashboard_platform_report_hourly to service_role;
create or replace function private.refresh_dashboard_platform_report_hour(
input_created_at timestamptz,
input_line text,
input_station_id text,
input_state public.heat_state
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
target_hour timestamptz := pg_catalog.date_trunc('hour', input_created_at);
begin
if input_station_id is null then
return;
end if;
delete from private.dashboard_platform_report_hourly
where hour_start = target_hour
and line = input_line
and station_id = input_station_id
and state = input_state;
insert into private.dashboard_platform_report_hourly (
hour_start, line, station_id, state, report_count, latest_report_at
)
select
target_hour,
reports.line,
reports.station_id,
reports.state,
pg_catalog.count(*)::integer,
pg_catalog.max(reports.created_at)
from public.reports
where reports.hidden_at is null
and reports.location_kind = 'platform'
and reports.station_id = input_station_id
and reports.created_at >= target_hour
and reports.created_at < target_hour + interval '1 hour'
and reports.line = input_line
and reports.state = input_state
group by reports.line, reports.station_id, reports.state;
end;
$$;
create or replace function private.sync_dashboard_platform_report_hourly()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
if tg_op in ('UPDATE', 'DELETE') and old.location_kind = 'platform' then
perform private.refresh_dashboard_platform_report_hour(old.created_at, old.line, old.station_id, old.state);
end if;
if tg_op in ('INSERT', 'UPDATE') and new.location_kind = 'platform' then
perform private.refresh_dashboard_platform_report_hour(new.created_at, new.line, new.station_id, new.state);
end if;
if tg_op = 'DELETE' then
return old;
end if;
return new;
end;
$$;
drop trigger if exists sync_dashboard_platform_report_hourly on public.reports;
create trigger sync_dashboard_platform_report_hourly
after insert or delete or update of created_at, line, station_id, state, hidden_at, location_kind on public.reports
for each row execute function private.sync_dashboard_platform_report_hourly();
revoke all on function private.refresh_dashboard_platform_report_hour(timestamptz, text, text, public.heat_state) from public, anon, authenticated;
revoke all on function private.sync_dashboard_platform_report_hourly() from public, anon, authenticated;
insert into private.dashboard_platform_report_hourly (
hour_start, line, station_id, state, report_count, latest_report_at
)
select
pg_catalog.date_trunc('hour', reports.created_at),
reports.line,
reports.station_id,
reports.state,
pg_catalog.count(*)::integer,
pg_catalog.max(reports.created_at)
from public.reports
where reports.hidden_at is null
and reports.location_kind = 'platform'
and reports.station_id is not null
group by 1, reports.line, reports.station_id, reports.state
on conflict (hour_start, line, station_id, state) do nothing;
