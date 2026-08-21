create or replace function public.dashboard_bucket_counts_v3(
  input_start timestamptz,
  input_end timestamptz,
  input_bucket_seconds integer,
  input_lines text[] default null,
  input_car_series integer[] default null
)
returns table (bucket_start timestamptz, line text, reports integer)
language sql stable
set search_path = ''
as $$
with facts as (
  select car_facts.hour_start, car_facts.line, car_facts.report_count
  from private.dashboard_report_hourly car_facts
  where car_facts.hour_start >= input_start
    and car_facts.hour_start < input_end
    and (input_lines is null or car_facts.line = any(input_lines))
    and (input_car_series is null or car_facts.car_series = any(input_car_series))
  union all
  select platform_facts.hour_start, platform_facts.line, platform_facts.report_count
  from private.dashboard_platform_report_hourly platform_facts
  where input_car_series is null
    and platform_facts.hour_start >= input_start
    and platform_facts.hour_start < input_end
    and (input_lines is null or platform_facts.line = any(input_lines))
)
select
  pg_catalog.to_timestamp(
    extract(epoch from input_start)
    + pg_catalog.floor(
      (extract(epoch from facts.hour_start) - extract(epoch from input_start))
      / input_bucket_seconds
    ) * input_bucket_seconds
  ),
  facts.line,
  pg_catalog.sum(facts.report_count)::integer
from facts
group by 1, facts.line;
$$;

create or replace function public.dashboard_worst_hours_v3(
  input_start timestamptz,
  input_end timestamptz,
  input_lines text[] default null,
  input_car_series integer[] default null
)
returns table (madrid_hour integer, reports integer)
language sql stable
set search_path = ''
as $$
with facts as (
  select car_facts.hour_start, car_facts.line, car_facts.report_count
  from private.dashboard_report_hourly car_facts
  where car_facts.hour_start >= input_start
    and car_facts.hour_start < input_end
    and (input_lines is null or car_facts.line = any(input_lines))
    and (input_car_series is null or car_facts.car_series = any(input_car_series))
  union all
  select platform_facts.hour_start, platform_facts.line, platform_facts.report_count
  from private.dashboard_platform_report_hourly platform_facts
  where input_car_series is null
    and platform_facts.hour_start >= input_start
    and platform_facts.hour_start < input_end
    and (input_lines is null or platform_facts.line = any(input_lines))
)
select
  extract(hour from facts.hour_start at time zone 'Europe/Madrid')::integer,
  pg_catalog.sum(facts.report_count)::integer
from facts
group by 1;
$$;

create or replace function public.dashboard_platform_summaries_v1(
  input_start timestamptz,
  input_end timestamptz,
  input_lines text[] default null
)
returns table (
  line text,
  station_id text,
  station_name text,
  reports integer,
  fresco_reports integer,
  calor_reports integer,
  infierno_reports integer,
  latest_report_at timestamptz
)
language sql stable
set search_path = ''
as $$
select
  facts.line,
  facts.station_id,
  stations.name,
  pg_catalog.sum(facts.report_count)::integer,
  coalesce(pg_catalog.sum(facts.report_count) filter (where facts.state = 'fresco'), 0)::integer,
  coalesce(pg_catalog.sum(facts.report_count) filter (where facts.state = 'calor'), 0)::integer,
  coalesce(pg_catalog.sum(facts.report_count) filter (where facts.state = 'infierno'), 0)::integer,
  pg_catalog.max(facts.latest_report_at)
from private.dashboard_platform_report_hourly facts
join public.metro_stations stations
  on stations.line = facts.line and stations.station_id = facts.station_id
where facts.hour_start >= input_start
  and facts.hour_start < input_end
  and (input_lines is null or facts.line = any(input_lines))
group by facts.line, facts.station_id, stations.name
order by
  pg_catalog.sum(facts.report_count) filter (where facts.state in ('calor', 'infierno')) desc,
  pg_catalog.sum(facts.report_count) filter (where facts.state = 'infierno') desc,
  pg_catalog.max(facts.latest_report_at) desc,
  stations.name;
$$;

-- Preserve the legacy Home contract for old application deployments.
-- Platform reports are deliberately invisible here so a DB-first rollout or
-- an application rollback keeps exactly the pre-platform semantics.
create or replace function public.dashboard_home_snapshot(
  input_start timestamptz,
  input_end timestamptz,
  input_limit integer default 25
)
returns table (reports_last_day integer, recent_reports jsonb)
language sql stable
set search_path = ''
as $$
select
  (
    select pg_catalog.count(*)::integer
    from public.reports
    where reports.hidden_at is null
      and reports.location_kind = 'car'
      and reports.created_at >= input_start
      and reports.created_at < input_end
  ),
  coalesce(
    (
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', recent.id,
          'line', recent.line,
          'car', recent.car,
          'state', recent.state,
          'created_at', recent.created_at
        )
        order by recent.created_at desc
      )
      from (
        select
          reports.id,
          reports.line,
          reports.car,
          reports.state,
          reports.created_at
        from public.reports
        where reports.hidden_at is null
          and reports.location_kind = 'car'
          and reports.created_at >= input_start
          and reports.created_at < input_end
        order by reports.created_at desc
        limit greatest(coalesce(input_limit, 25), 0)
      ) recent
    ),
    '[]'::jsonb
  );
$$;

-- New Home contract consumed only by the platform-aware application.
create or replace function public.dashboard_home_snapshot_v2(
  input_start timestamptz,
  input_end timestamptz,
  input_limit integer default 25
)
returns table (reports_last_day integer, recent_reports jsonb)
language sql stable
set search_path = ''
as $$
select
  (
    select pg_catalog.count(*)::integer
    from public.reports
    where reports.hidden_at is null
      and reports.created_at >= input_start
      and reports.created_at < input_end
  ),
  coalesce(
    (
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', recent.id,
          'line', recent.line,
          'car', recent.car,
          'location_kind', recent.location_kind,
          'station_id', recent.station_id,
          'state', recent.state,
          'created_at', recent.created_at
        )
        order by recent.created_at desc
      )
      from (
        select
          reports.id,
          reports.line,
          reports.car,
          reports.location_kind,
          reports.station_id,
          reports.state,
          reports.created_at
        from public.reports
        where reports.hidden_at is null
          and reports.created_at >= input_start
          and reports.created_at < input_end
        order by reports.created_at desc
        limit greatest(coalesce(input_limit, 25), 0)
      ) recent
    ),
    '[]'::jsonb
  );
$$;

revoke execute on function public.dashboard_bucket_counts_v3(timestamptz, timestamptz, integer, text[], integer[]) from public, anon, authenticated;
revoke execute on function public.dashboard_worst_hours_v3(timestamptz, timestamptz, text[], integer[]) from public, anon, authenticated;
revoke all on function public.dashboard_platform_summaries_v1(timestamptz, timestamptz, text[]) from public, anon, authenticated;
revoke execute on function public.dashboard_home_snapshot(timestamptz, timestamptz, integer) from public, anon, authenticated;
revoke execute on function public.dashboard_home_snapshot_v2(timestamptz, timestamptz, integer) from public, anon, authenticated;

grant execute on function public.dashboard_bucket_counts_v3(timestamptz, timestamptz, integer, text[], integer[]) to service_role;
grant execute on function public.dashboard_worst_hours_v3(timestamptz, timestamptz, text[], integer[]) to service_role;
grant execute on function public.dashboard_platform_summaries_v1(timestamptz, timestamptz, text[]) to service_role;
grant execute on function public.dashboard_home_snapshot(timestamptz, timestamptz, integer) to service_role;
grant execute on function public.dashboard_home_snapshot_v2(timestamptz, timestamptz, integer) to service_role;
