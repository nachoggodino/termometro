-- Harden platform reporting without changing legacy RPC contracts.

create index if not exists reports_station_line_fk_idx
  on public.reports (line, station_id)
  where station_id is not null;

-- Keep car facts correct when a report changes location kind and avoid refreshing
-- the car fact table for platform-only writes.
create or replace function private.sync_dashboard_report_hourly()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and old.location_kind = 'car'
    and new.location_kind = 'car'
    and pg_catalog.date_trunc('hour', old.created_at) = pg_catalog.date_trunc('hour', new.created_at)
    and old.line = new.line
    and old.car is not distinct from new.car
    and old.state = new.state then
    perform private.refresh_dashboard_report_hour(new.created_at, new.line, new.car, new.state);
    return new;
  end if;

  if tg_op in ('UPDATE', 'DELETE') and old.location_kind = 'car' then
    perform private.refresh_dashboard_report_hour(old.created_at, old.line, old.car, old.state);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.location_kind = 'car' then
    perform private.refresh_dashboard_report_hour(new.created_at, new.line, new.car, new.state);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_dashboard_report_hourly() from public, anon, authenticated;

drop trigger if exists sync_dashboard_report_hourly on public.reports;
create trigger sync_dashboard_report_hourly
after insert or delete or update of created_at, line, car, state, hidden_at, location_kind on public.reports
for each row execute function private.sync_dashboard_report_hourly();

-- Platform drill-down reads bounded hourly facts rather than raw reports.
create or replace function public.dashboard_platform_history_v1(
  input_start timestamptz,
  input_end timestamptz,
  input_lines text[],
  input_station_id text
)
returns table (
  hour_start timestamptz,
  line text,
  state public.heat_state,
  reports integer
)
language sql stable
set search_path = ''
as $$
select
  facts.hour_start,
  facts.line,
  facts.state,
  facts.report_count
from private.dashboard_platform_report_hourly facts
where facts.hour_start >= input_start
  and facts.hour_start < input_end
  and facts.station_id = input_station_id
  and (input_lines is null or facts.line = any(input_lines))
order by facts.hour_start, facts.line, facts.state;
$$;

revoke all on function public.dashboard_platform_history_v1(timestamptz, timestamptz, text[], text)
  from public, anon, authenticated;
grant execute on function public.dashboard_platform_history_v1(timestamptz, timestamptz, text[], text)
  to service_role;

-- Abuse fingerprints are kept only in this private, self-pruning event table.
-- The origin key preserves the existing IP+UA limit; the network key adds a
-- higher IP-only ceiling so rotating User-Agent values cannot create infinite quota.
create table if not exists private.report_abuse_events (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.reports(id) on delete cascade,
  origin_key text not null,
  network_key text not null,
  created_at timestamptz not null,
  location_kind text not null check (location_kind in ('car', 'platform')),
  has_car boolean not null,
  unique (report_id)
);

alter table private.report_abuse_events enable row level security;
revoke all on table private.report_abuse_events from public, anon, authenticated;

create index if not exists report_abuse_events_origin_created_idx
  on private.report_abuse_events (origin_key, created_at desc);
create index if not exists report_abuse_events_network_created_idx
  on private.report_abuse_events (network_key, created_at desc);
create index if not exists report_abuse_events_created_idx
  on private.report_abuse_events (created_at);

-- Historical hashes no longer need to remain attached to report rows once they
-- are outside the longest abuse-control window. Recent v2 hashes are retained
-- temporarily so a rolling deployment preserves the existing quota.
update public.reports
set abuse_key = null
where abuse_key is not null
  and created_at < pg_catalog.now() - interval '30 minutes';

create or replace function public.create_report_v3(
  input_line text,
  input_car text,
  input_location_kind text,
  input_station_id text,
  input_state public.heat_state,
  input_origin_abuse_key text,
  input_network_abuse_key text,
  input_undo_token_hash text,
  input_undo_expires_at timestamptz,
  input_now timestamptz,
  input_rate_limit_start timestamptz,
  input_rate_limit_max integer,
  input_network_rate_limit_max integer,
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
    or input_location_kind not in ('car', 'platform')
    or input_state is null then
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

  if input_network_abuse_key is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtext('rate:network:' || input_network_abuse_key)
    );
  end if;
  if input_origin_abuse_key is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtext('rate:origin:' || input_origin_abuse_key)
    );
  end if;

  delete from private.report_abuse_events
  where created_at < input_now - interval '30 minutes';

  update public.reports
  set abuse_key = null
  where abuse_key is not null
    and created_at < input_now - interval '30 minutes';

  if input_origin_abuse_key is not null and (
    (
      select pg_catalog.count(*)
      from private.report_abuse_events events
      where events.origin_key = input_origin_abuse_key
        and events.created_at >= input_rate_limit_start
    )
    +
    (
      select pg_catalog.count(*)
      from public.reports reports
      where reports.abuse_key = input_origin_abuse_key
        and reports.created_at >= input_rate_limit_start
    )
  ) >= input_rate_limit_max then
    return query select false, 'rate_limited'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
    return;
  end if;

  if input_network_abuse_key is not null and (
    select pg_catalog.count(*)
    from private.report_abuse_events events
    where events.network_key = input_network_abuse_key
      and events.created_at >= input_rate_limit_start
  ) >= input_network_rate_limit_max then
    return query select false, 'rate_limited'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
    return;
  end if;

  if input_location_kind = 'car' and input_car is null
    and input_origin_abuse_key is not null
    and (
      exists (
        select 1
        from private.report_abuse_events events
        join public.reports reports on reports.id = events.report_id
        where events.origin_key = input_origin_abuse_key
          and events.location_kind = 'car'
          and not events.has_car
          and events.created_at >= input_now - interval '30 minutes'
          and reports.hidden_at is null
        limit 1
      )
      or exists (
        select 1
        from public.reports reports
        where reports.abuse_key = input_origin_abuse_key
          and reports.location_kind = 'car'
          and reports.car is null
          and reports.created_at >= input_now - interval '30 minutes'
          and reports.hidden_at is null
        limit 1
      )
    ) then
    return query select false, 'duplicate'::text, null::uuid, null::text, null::text, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
    return;
  end if;

  if input_location_kind = 'car' and input_car is null then
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
    null,
    input_undo_token_hash,
    input_undo_expires_at,
    input_now
  )
  returning * into inserted_report;

  if input_origin_abuse_key is not null and input_network_abuse_key is not null then
    insert into private.report_abuse_events (
      report_id,
      origin_key,
      network_key,
      created_at,
      location_kind,
      has_car
    ) values (
      inserted_report.id,
      input_origin_abuse_key,
      input_network_abuse_key,
      input_now,
      input_location_kind,
      input_location_kind = 'car' and input_car is not null
    );
  end if;

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

revoke all on function public.create_report_v3(
  text, text, text, text, public.heat_state, text, text, text,
  timestamptz, timestamptz, timestamptz, integer, integer, timestamptz
) from public, anon, authenticated;
grant execute on function public.create_report_v3(
  text, text, text, text, public.heat_state, text, text, text,
  timestamptz, timestamptz, timestamptz, integer, integer, timestamptz
) to service_role;
