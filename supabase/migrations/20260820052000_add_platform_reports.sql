alter table public.reports
add column if not exists location_kind text not null default 'car',
add column if not exists station_id text;
alter table public.reports
drop constraint if exists reports_location_kind_check,
drop constraint if exists reports_location_payload_check,
drop constraint if exists reports_station_line_fk;
create table if not exists public.metro_stations (
line text not null,
station_id text not null,
name text not null,
sort_order smallint not null check (sort_order >= 0),
active boolean not null default true,
primary key (line, station_id),
constraint metro_stations_line_check check (line in ('L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11','L12')),
constraint metro_stations_station_id_check check (station_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
alter table public.metro_stations enable row level security;
revoke all on table public.metro_stations from public, anon, authenticated;
grant select on table public.metro_stations to service_role;
alter table public.reports
add constraint reports_location_kind_check
check (location_kind in ('car', 'platform')) not valid,
add constraint reports_location_payload_check
check (
(location_kind = 'car' and station_id is null)
or
(location_kind = 'platform' and car is null and station_id is not null)
) not valid,
add constraint reports_station_line_fk
foreign key (line, station_id)
references public.metro_stations (line, station_id)
not valid;
alter table public.reports validate constraint reports_location_kind_check;
alter table public.reports validate constraint reports_location_payload_check;
alter table public.reports validate constraint reports_station_line_fk;
create index if not exists reports_visible_platform_created_line_idx
on public.reports (created_at, line, station_id, state)
where hidden_at is null and location_kind = 'platform';
create or replace function public.create_report_v2(
input_line text,
input_car text,
input_location_kind text,
input_station_id text,
input_state public.heat_state,
input_abuse_key text,
input_undo_token_hash text,
input_undo_expires_at timestamptz,
input_now timestamptz,
input_rate_limit_start timestamptz,
input_rate_limit_max integer,
input_duplicate_window_start timestamptz
)
returns table (
ok boolean,
reason text,
id uuid,
line text,
car text,
location_kind text,
station_id text,
state public.heat_state,
created_at timestamptz,
hidden_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
inserted_report public.reports%rowtype;
input_car_number integer;
begin
input_location_kind := coalesce(input_location_kind, 'car');
if input_line not in ('L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11','L12')
or input_location_kind not in ('car', 'platform') then
return query select false, 'invalid'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
return;
end if;
if input_location_kind = 'platform' then
if input_car is not null then
return query select false, 'invalid'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
return;
end if;
if input_station_id is null or not exists (
select 1
from public.metro_stations
where metro_stations.line = input_line
and metro_stations.station_id = input_station_id
and metro_stations.active
) then
return query select false, 'station_not_on_line'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
return;
end if;
else
if input_station_id is not null then
return query select false, 'invalid'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
return;
end if;
if input_car is not null then
if input_car !~ '^[MRS][0-9]{4,5}$' then
return query select false, 'invalid'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
return;
end if;
input_car_number := substring(input_car from '[0-9]+')::integer;
if input_car_number is null
or input_car_number not between 2000 and 11999
or (input_line = 'L1' and input_car_number not between 2000 and 2999) then
return query select false, 'car_not_on_line'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
return;
end if;
end if;
end if;
if input_abuse_key is not null then
perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('rate:' || input_abuse_key));
if (
select count(*)
from public.reports
where reports.abuse_key = input_abuse_key
and reports.created_at >= input_rate_limit_start
) >= input_rate_limit_max then
return query select false, 'rate_limited'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
return;
end if;
end if;
if input_location_kind = 'car' and input_car is null then
if input_abuse_key is not null and exists (
select 1
from public.reports
where reports.abuse_key = input_abuse_key
and reports.location_kind = 'car'
and reports.car is null
and reports.created_at >= input_now - interval '30 minutes'
and reports.hidden_at is null
limit 1
) then
return query select false, 'duplicate'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
return;
end if;
perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('duplicate:no-car:' || input_line));
if exists (
select 1
from public.reports
where reports.location_kind = 'car'
and reports.line = input_line
and reports.car is null
and reports.created_at >= input_duplicate_window_start
and reports.hidden_at is null
limit 1
) then
return query select false, 'duplicate'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
return;
end if;
elsif input_location_kind = 'car' then
perform pg_catalog.pg_advisory_xact_lock(
pg_catalog.hashtext('duplicate:car:' || input_line || ':' || input_car || ':' || input_state::text)
);
if exists (
select 1
from public.reports
where reports.location_kind = 'car'
and reports.line = input_line
and reports.state = input_state
and reports.created_at >= input_duplicate_window_start
and reports.hidden_at is null
and reports.car = input_car
limit 1
) then
return query select false, 'duplicate'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
return;
end if;
else
perform pg_catalog.pg_advisory_xact_lock(
pg_catalog.hashtext('duplicate:platform:' || input_line || ':' || input_station_id || ':' || input_state::text)
);
if exists (
select 1
from public.reports
where reports.location_kind = 'platform'
and reports.line = input_line
and reports.station_id = input_station_id
and reports.state = input_state
and reports.created_at >= input_duplicate_window_start
and reports.hidden_at is null
limit 1
) then
return query select false, 'duplicate'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
return;
end if;
end if;
insert into public.reports (
line,
car,
location_kind,
station_id,
state,
abuse_key,
undo_token_hash,
undo_expires_at,
created_at
)
values (
input_line,
case when input_location_kind = 'car' then input_car else null end,
input_location_kind,
case when input_location_kind = 'platform' then input_station_id else null end,
input_state,
input_abuse_key,
input_undo_token_hash,
input_undo_expires_at,
input_now
)
returning * into inserted_report;
return query
select
true,
null::text,
inserted_report.id,
inserted_report.line,
inserted_report.car,
inserted_report.location_kind,
inserted_report.station_id,
inserted_report.state,
inserted_report.created_at,
inserted_report.hidden_at;
end;
$$;
revoke all on function public.create_report_v2(text, text, text, text, public.heat_state, text, text, timestamptz, timestamptz, timestamptz, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.create_report_v2(text, text, text, text, public.heat_state, text, text, timestamptz, timestamptz, timestamptz, integer, timestamptz) to service_role;
