create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.dashboard_migration_state (
  name text primary key,
  completed_at timestamptz not null default now()
);
alter table private.dashboard_migration_state enable row level security;

create table private.dashboard_report_hourly (
  hour_start timestamptz not null,
  line text not null,
  car_key text not null,
  car_series integer,
  state public.heat_state not null,
  report_count integer not null check (report_count > 0),
  decay_weight_sum double precision not null,
  latest_report_at timestamptz not null,
  primary key (hour_start, line, car_key, state)
);
alter table private.dashboard_report_hourly enable row level security;

create index dashboard_report_hourly_filters_idx
  on private.dashboard_report_hourly (hour_start, line, car_series);
create index dashboard_report_hourly_series_idx
  on private.dashboard_report_hourly (car_series, hour_start, line)
  where car_series is not null;
create index dashboard_report_hourly_car_idx
  on private.dashboard_report_hourly (car_key, hour_start);

create function private.refresh_dashboard_report_hour(
  input_created_at timestamptz,
  input_line text,
  input_car text,
  input_state public.heat_state
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  target_hour timestamptz := date_trunc('hour', input_created_at);
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
    count(*)::integer,
    sum(power(2.0, extract(epoch from (reports.created_at - timestamptz '2020-01-01 00:00:00+00')) / 259200.0)),
    max(reports.created_at)
  from public.reports
  where reports.hidden_at is null
    and reports.created_at >= target_hour
    and reports.created_at < target_hour + interval '1 hour'
    and reports.line = input_line
    and reports.car is not distinct from input_car
    and reports.state = input_state
  group by reports.line, reports.car, reports.state;
end;
$$;

create function private.sync_dashboard_report_hourly()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if tg_op = 'UPDATE'
    and date_trunc('hour', old.created_at) = date_trunc('hour', new.created_at)
    and old.line = new.line
    and old.car is not distinct from new.car
    and old.state = new.state then
    perform private.refresh_dashboard_report_hour(new.created_at, new.line, new.car, new.state);
    return new;
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    perform private.refresh_dashboard_report_hour(old.created_at, old.line, old.car, old.state);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform private.refresh_dashboard_report_hour(new.created_at, new.line, new.car, new.state);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger sync_dashboard_report_hourly
after insert or delete or update of created_at, line, car, state, hidden_at on public.reports
for each row execute function private.sync_dashboard_report_hourly();

revoke all on function private.refresh_dashboard_report_hour(timestamptz, text, text, public.heat_state) from public, anon, authenticated;
revoke all on function private.sync_dashboard_report_hourly() from public, anon, authenticated;
grant usage on schema private to service_role;
grant select on private.dashboard_report_hourly to service_role;

create function public.dashboard_bucket_counts_v2(
  input_start timestamptz,
  input_end timestamptz,
  input_bucket_seconds integer,
  input_lines text[] default null,
  input_car_series integer[] default null
)
returns table (bucket_start timestamptz, line text, reports integer)
language sql stable
as $$
  select
    to_timestamp(extract(epoch from input_start) + floor((extract(epoch from facts.hour_start) - extract(epoch from input_start)) / input_bucket_seconds) * input_bucket_seconds),
    facts.line,
    sum(facts.report_count)::integer
  from private.dashboard_report_hourly facts
  where facts.hour_start >= input_start
    and facts.hour_start < input_end
    and (input_lines is null or facts.line = any(input_lines))
    and (input_car_series is null or facts.car_series = any(input_car_series))
  group by 1, facts.line;
$$;

create function public.dashboard_car_summaries_v2(
  input_start timestamptz,
  input_end timestamptz,
  input_lines text[] default null,
  input_car_series integer[] default null,
  input_car text default null
)
returns table (car text, lines text[], reports integer, fresco_reports integer, calor_reports integer, infierno_reports integer)
language sql stable
as $$
  select
    facts.car_key,
    array_agg(distinct facts.line order by facts.line),
    sum(facts.report_count)::integer,
    coalesce(sum(facts.report_count) filter (where facts.state = 'fresco'), 0)::integer,
    coalesce(sum(facts.report_count) filter (where facts.state = 'calor'), 0)::integer,
    coalesce(sum(facts.report_count) filter (where facts.state = 'infierno'), 0)::integer
  from private.dashboard_report_hourly facts
  where facts.hour_start >= input_start
    and facts.hour_start < input_end
    and facts.car_key <> ''
    and (input_lines is null or facts.line = any(input_lines))
    and (input_car_series is null or facts.car_series = any(input_car_series))
    and (input_car is null or facts.car_key = input_car)
  group by facts.car_key
  order by sum(facts.report_count) filter (where facts.state <> 'fresco') desc, sum(facts.report_count) desc, facts.car_key;
$$;

create function public.dashboard_car_histories_v2(
  input_start timestamptz,
  input_end timestamptz,
  input_bucket_seconds integer,
  input_lines text[] default null,
  input_car_series integer[] default null,
  input_car text default null
)
returns table (car text, bucket_start timestamptz, reports integer)
language sql stable
as $$
  select
    facts.car_key,
    to_timestamp(extract(epoch from input_start) + floor((extract(epoch from facts.hour_start) - extract(epoch from input_start)) / input_bucket_seconds) * input_bucket_seconds),
    sum(facts.report_count)::integer
  from private.dashboard_report_hourly facts
  where facts.hour_start >= input_start
    and facts.hour_start < input_end
    and facts.car_key <> ''
    and (input_lines is null or facts.line = any(input_lines))
    and (input_car_series is null or facts.car_series = any(input_car_series))
    and (input_car is null or facts.car_key = input_car)
  group by facts.car_key, 2;
$$;

create function public.dashboard_car_series_v2(
  input_start timestamptz,
  input_end timestamptz,
  input_lines text[] default null,
  input_car_series integer[] default null
)
returns table (series integer, reports integer)
language sql stable
as $$
  select facts.car_series, sum(facts.report_count)::integer
  from private.dashboard_report_hourly facts
  where facts.hour_start >= input_start
    and facts.hour_start < input_end
    and facts.car_series is not null
    and (input_lines is null or facts.line = any(input_lines))
    and (input_car_series is null or facts.car_series = any(input_car_series))
  group by facts.car_series
  order by facts.car_series;
$$;

create function public.dashboard_worst_hours_v2(
  input_start timestamptz,
  input_end timestamptz,
  input_lines text[] default null,
  input_car_series integer[] default null
)
returns table (madrid_hour integer, reports integer)
language sql stable
as $$
  select extract(hour from facts.hour_start at time zone 'Europe/Madrid')::integer, sum(facts.report_count)::integer
  from private.dashboard_report_hourly facts
  where facts.hour_start >= input_start
    and facts.hour_start < input_end
    and (input_lines is null or facts.line = any(input_lines))
    and (input_car_series is null or facts.car_series = any(input_car_series))
  group by 1;
$$;

create function public.dashboard_line_car_reports_v2(
  input_start timestamptz,
  input_end timestamptz,
  input_lines text[] default null,
  input_car_series integer[] default null
)
returns table (line text, car text, reports integer, fresco_reports integer, calor_reports integer, infierno_reports integer)
language sql stable
as $$
  select
    facts.line,
    facts.car_key,
    sum(facts.report_count)::integer,
    coalesce(sum(facts.report_count) filter (where facts.state = 'fresco'), 0)::integer,
    coalesce(sum(facts.report_count) filter (where facts.state = 'calor'), 0)::integer,
    coalesce(sum(facts.report_count) filter (where facts.state = 'infierno'), 0)::integer
  from private.dashboard_report_hourly facts
  where facts.hour_start >= input_start
    and facts.hour_start < input_end
    and facts.car_key <> ''
    and (input_lines is null or facts.line = any(input_lines))
    and (input_car_series is null or facts.car_series = any(input_car_series))
  group by facts.line, facts.car_key
  order by facts.line, sum(facts.report_count) desc, facts.car_key;
$$;

create function public.dashboard_line_summaries_v2(
  input_visible_start timestamptz,
  input_visible_end timestamptz,
  input_index_start timestamptz,
  input_lines text[] default null,
  input_car_series integer[] default null,
  input_as_of timestamptz default now()
)
returns table (
  line text, reports integer, fresco_reports integer, calor_reports integer, infierno_reports integer,
  cars_reported integer, cars_without_ac_reported integer, latest_report_at timestamptz,
  heat_index double precision, weighted_heat double precision, effective_reports double precision,
  report_score double precision, weighted_fleet_percentage double precision, fleet_score double precision
)
language sql stable
as $$
  with lines(line) as (
    values ('L1'), ('L2'), ('L3'), ('L4'), ('L5'), ('L6'), ('L7'), ('L8'), ('L9'), ('L10'), ('L11'), ('L12')
  ), selected_lines as (
    select line from lines where input_lines is null or line = any(input_lines)
  ), visible as (
    select * from private.dashboard_report_hourly facts
    where facts.hour_start >= input_visible_start and facts.hour_start < input_visible_end
      and (input_lines is null or facts.line = any(input_lines))
      and (input_car_series is null or facts.car_series = any(input_car_series))
  ), visible_car_counts as (
    select line, car_key,
      coalesce(sum(report_count) filter (where state = 'fresco'), 0) as fresco_reports,
      coalesce(sum(report_count) filter (where state = 'calor'), 0) as calor_reports,
      coalesce(sum(report_count) filter (where state = 'infierno'), 0) as infierno_reports
    from visible where car_key <> '' group by line, car_key
  ), visible_counts as (
    select line,
      sum(report_count)::integer as reports,
      sum(report_count) filter (where state = 'fresco')::integer as fresco_reports,
      sum(report_count) filter (where state = 'calor')::integer as calor_reports,
      sum(report_count) filter (where state = 'infierno')::integer as infierno_reports,
      count(distinct car_key) filter (where car_key <> '')::integer as cars_reported,
      (select count(*)::integer from visible_car_counts cars where cars.line = visible.line and cars.calor_reports + cars.infierno_reports - cars.fresco_reports > 2) as cars_without_ac_reported,
      max(latest_report_at) as latest_report_at
    from visible group by line
  ), index_facts as (
    select * from private.dashboard_report_hourly facts
    where facts.hour_start >= input_index_start and facts.hour_start < input_visible_end
      and (input_lines is null or facts.line = any(input_lines))
      and (input_car_series is null or facts.car_series = any(input_car_series))
  ), line_weights as (
    select line,
      sum(decay_weight_sum) * power(2.0, -extract(epoch from (input_as_of - timestamptz '2020-01-01 00:00:00+00')) / 259200.0) as effective_reports,
      sum(decay_weight_sum * case state when 'fresco' then 0.0 when 'calor' then 60.0 when 'infierno' then 100.0 end)
        * power(2.0, -extract(epoch from (input_as_of - timestamptz '2020-01-01 00:00:00+00')) / 259200.0) as weighted_heat_total
    from index_facts group by line
  ), car_latest as (
    select line, car_key, max(latest_report_at) as latest_report_at
    from index_facts where car_key <> '' group by line, car_key
  ), fleet_weights as (
    select line, sum(power(2.0, -(greatest(0.0, extract(epoch from (input_as_of - latest_report_at)) / 86400.0) / 3.0))) as weighted_cars
    from car_latest group by line
  ), diagnostics as (
    select selected_lines.line,
      coalesce(line_weights.effective_reports, 0.0) as effective_reports,
      case when coalesce(line_weights.effective_reports, 0.0) = 0 then 0.0 else line_weights.weighted_heat_total / line_weights.effective_reports end as weighted_heat,
      case when coalesce(line_weights.effective_reports, 0.0) <= 0 then 0.0 else 100.0 * (1.0 - power(2.0, -line_weights.effective_reports / 30.0)) end as report_score,
      least(100.0, 100.0 * coalesce(fleet_weights.weighted_cars, 0.0) / greatest(1, coalesce(fleet.estimated_total_cars, 1))) as weighted_fleet_percentage
    from selected_lines
    left join line_weights on line_weights.line = selected_lines.line
    left join fleet_weights on fleet_weights.line = selected_lines.line
    left join public.line_fleet_estimates fleet on fleet.line = selected_lines.line
  )
  select selected_lines.line,
    coalesce(visible_counts.reports, 0), coalesce(visible_counts.fresco_reports, 0), coalesce(visible_counts.calor_reports, 0), coalesce(visible_counts.infierno_reports, 0),
    coalesce(visible_counts.cars_reported, 0), coalesce(visible_counts.cars_without_ac_reported, 0), visible_counts.latest_report_at,
    round(((diagnostics.weighted_heat / 100.0) * (0.65 * diagnostics.report_score + 0.35 * (case when diagnostics.weighted_fleet_percentage <= 0 then 0.0 else 100.0 * (1.0 - power(2.0, -diagnostics.weighted_fleet_percentage / 30.0)) end)))::numeric, 2)::double precision,
    round(diagnostics.weighted_heat::numeric, 2)::double precision,
    round(diagnostics.effective_reports::numeric, 2)::double precision,
    round(diagnostics.report_score::numeric, 2)::double precision,
    round(diagnostics.weighted_fleet_percentage::numeric, 2)::double precision,
    round((case when diagnostics.weighted_fleet_percentage <= 0 then 0.0 else 100.0 * (1.0 - power(2.0, -diagnostics.weighted_fleet_percentage / 30.0)) end)::numeric, 2)::double precision
  from selected_lines
  left join visible_counts on visible_counts.line = selected_lines.line
  left join diagnostics on diagnostics.line = selected_lines.line;
$$;

create function public.dashboard_heat_trend_v2(
  input_range_start timestamptz,
  input_range_end timestamptz,
  input_index_start timestamptz,
  input_bucket_seconds integer,
  input_lines text[] default null,
  input_car_series integer[] default null,
  input_as_of timestamptz default now()
)
returns table (bucket_start timestamptz, line text, heat_index double precision)
language sql stable
as $$
  with lines(line) as (
    values ('L1'), ('L2'), ('L3'), ('L4'), ('L5'), ('L6'), ('L7'), ('L8'), ('L9'), ('L10'), ('L11'), ('L12')
  ), selected_lines as (
    select line from lines where input_lines is null or line = any(input_lines)
  ), bucket_lines as (
    select bucket_start, least(bucket_start + make_interval(secs => input_bucket_seconds), input_as_of) as bucket_as_of, selected_lines.line
    from generate_series(input_range_start, input_range_end, make_interval(secs => input_bucket_seconds)) as buckets(bucket_start)
    cross join selected_lines
  ), line_weights as (
    select bucket_lines.bucket_start, bucket_lines.line,
      sum(facts.decay_weight_sum) * power(2.0, -extract(epoch from (bucket_lines.bucket_as_of - timestamptz '2020-01-01 00:00:00+00')) / 259200.0) as effective_reports,
      sum(facts.decay_weight_sum * case facts.state when 'fresco' then 0.0 when 'calor' then 60.0 when 'infierno' then 100.0 end)
        * power(2.0, -extract(epoch from (bucket_lines.bucket_as_of - timestamptz '2020-01-01 00:00:00+00')) / 259200.0) as weighted_heat_total
    from bucket_lines
    left join private.dashboard_report_hourly facts on facts.line = bucket_lines.line
      and facts.hour_start >= input_index_start and facts.hour_start < bucket_lines.bucket_as_of
      and (input_car_series is null or facts.car_series = any(input_car_series))
    group by bucket_lines.bucket_start, bucket_lines.bucket_as_of, bucket_lines.line
  ), car_latest as (
    select bucket_lines.bucket_start, bucket_lines.bucket_as_of, bucket_lines.line, facts.car_key, max(facts.latest_report_at) as latest_report_at
    from bucket_lines
    join private.dashboard_report_hourly facts on facts.line = bucket_lines.line and facts.car_key <> ''
      and facts.hour_start >= input_index_start and facts.hour_start < bucket_lines.bucket_as_of
      and (input_car_series is null or facts.car_series = any(input_car_series))
    group by bucket_lines.bucket_start, bucket_lines.bucket_as_of, bucket_lines.line, facts.car_key
  ), fleet_weights as (
    select bucket_start, line,
      sum(power(2.0, -(greatest(0.0, extract(epoch from (bucket_as_of - latest_report_at)) / 86400.0) / 3.0))) as weighted_cars
    from car_latest group by bucket_start, line
  ), diagnostics as (
    select line_weights.bucket_start, line_weights.line,
      coalesce(line_weights.effective_reports, 0.0) as effective_reports,
      case when coalesce(line_weights.effective_reports, 0.0) = 0 then 0.0 else line_weights.weighted_heat_total / line_weights.effective_reports end as weighted_heat,
      case when coalesce(line_weights.effective_reports, 0.0) <= 0 then 0.0 else 100.0 * (1.0 - power(2.0, -line_weights.effective_reports / 30.0)) end as report_score,
      least(100.0, 100.0 * coalesce(fleet_weights.weighted_cars, 0.0) / greatest(1, coalesce(fleet.estimated_total_cars, 1))) as weighted_fleet_percentage
    from line_weights
    left join fleet_weights on fleet_weights.bucket_start = line_weights.bucket_start and fleet_weights.line = line_weights.line
    left join public.line_fleet_estimates fleet on fleet.line = line_weights.line
  )
  select diagnostics.bucket_start, diagnostics.line,
    round(((diagnostics.weighted_heat / 100.0) * (0.65 * diagnostics.report_score + 0.35 * (case when diagnostics.weighted_fleet_percentage <= 0 then 0.0 else 100.0 * (1.0 - power(2.0, -diagnostics.weighted_fleet_percentage / 30.0)) end)))::numeric, 2)::double precision
  from diagnostics;
$$;

create function public.dashboard_home_snapshot(
  input_start timestamptz,
  input_end timestamptz,
  input_limit integer default 25
)
returns table (reports_last_day integer, recent_reports jsonb)
language sql stable
as $$
  select
    (select count(*)::integer from public.reports where hidden_at is null and created_at >= input_start and created_at <= input_end),
    coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'line', line, 'car', car, 'state', state, 'created_at', created_at) order by created_at desc)
      from (select id, line, car, state, created_at from public.reports where hidden_at is null and created_at >= input_start and created_at <= input_end order by created_at desc limit least(greatest(input_limit, 1), 25)) recent
    ), '[]'::jsonb);
$$;

revoke execute on function public.dashboard_bucket_counts_v2(timestamptz, timestamptz, integer, text[], integer[]) from public, anon, authenticated;
revoke execute on function public.dashboard_car_summaries_v2(timestamptz, timestamptz, text[], integer[], text) from public, anon, authenticated;
revoke execute on function public.dashboard_car_histories_v2(timestamptz, timestamptz, integer, text[], integer[], text) from public, anon, authenticated;
revoke execute on function public.dashboard_car_series_v2(timestamptz, timestamptz, text[], integer[]) from public, anon, authenticated;
revoke execute on function public.dashboard_worst_hours_v2(timestamptz, timestamptz, text[], integer[]) from public, anon, authenticated;
revoke execute on function public.dashboard_line_car_reports_v2(timestamptz, timestamptz, text[], integer[]) from public, anon, authenticated;
revoke execute on function public.dashboard_line_summaries_v2(timestamptz, timestamptz, timestamptz, text[], integer[], timestamptz) from public, anon, authenticated;
revoke execute on function public.dashboard_heat_trend_v2(timestamptz, timestamptz, timestamptz, integer, text[], integer[], timestamptz) from public, anon, authenticated;
revoke execute on function public.dashboard_home_snapshot(timestamptz, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.dashboard_bucket_counts_v2(timestamptz, timestamptz, integer, text[], integer[]) to service_role;
grant execute on function public.dashboard_car_summaries_v2(timestamptz, timestamptz, text[], integer[], text) to service_role;
grant execute on function public.dashboard_car_histories_v2(timestamptz, timestamptz, integer, text[], integer[], text) to service_role;
grant execute on function public.dashboard_car_series_v2(timestamptz, timestamptz, text[], integer[]) to service_role;
grant execute on function public.dashboard_worst_hours_v2(timestamptz, timestamptz, text[], integer[]) to service_role;
grant execute on function public.dashboard_line_car_reports_v2(timestamptz, timestamptz, text[], integer[]) to service_role;
grant execute on function public.dashboard_line_summaries_v2(timestamptz, timestamptz, timestamptz, text[], integer[], timestamptz) to service_role;
grant execute on function public.dashboard_heat_trend_v2(timestamptz, timestamptz, timestamptz, integer, text[], integer[], timestamptz) to service_role;
grant execute on function public.dashboard_home_snapshot(timestamptz, timestamptz, integer) to service_role;
