create index if not exists reports_visible_created_line_idx
on public.reports (created_at desc, line)
where hidden_at is null;

create index if not exists reports_visible_line_car_created_idx
on public.reports (line, car, created_at desc)
where hidden_at is null and car is not null;

create index if not exists reports_visible_car_created_idx
on public.reports (car, created_at desc)
where hidden_at is null and car is not null;

create or replace function public.dashboard_line_summaries(
  input_visible_start timestamptz,
  input_visible_end timestamptz,
  input_index_start timestamptz,
  input_lines text[] default null,
  input_as_of timestamptz default now()
)
returns table (
  line text,
  reports integer,
  fresco_reports integer,
  calor_reports integer,
  infierno_reports integer,
  cars_reported integer,
  cars_without_ac_reported integer,
  latest_report_at timestamptz,
  heat_index double precision,
  weighted_heat double precision,
  effective_reports double precision,
  report_score double precision,
  weighted_fleet_percentage double precision,
  fleet_score double precision
)
language sql
stable
as $$
  with lines(line) as (
    values ('L1'), ('L2'), ('L3'), ('L4'), ('L5'), ('L6'), ('L7'), ('L8'), ('L9'), ('L10'), ('L11'), ('L12')
  ),
  selected_lines as (
    select line
    from lines
    where input_lines is null or line = any(input_lines)
  ),
  visible as (
    select reports.line, reports.car, reports.state, reports.created_at
    from public.reports
    where reports.hidden_at is null
      and reports.created_at >= input_visible_start
      and reports.created_at <= input_visible_end
      and (input_lines is null or reports.line = any(input_lines))
  ),
  visible_counts as (
    select
      visible.line,
      count(*)::integer as reports,
      count(*) filter (where visible.state = 'fresco')::integer as fresco_reports,
      count(*) filter (where visible.state = 'calor')::integer as calor_reports,
      count(*) filter (where visible.state = 'infierno')::integer as infierno_reports,
      count(distinct visible.car) filter (where visible.car is not null)::integer as cars_reported,
      count(distinct visible.car) filter (where visible.car is not null and visible.state <> 'fresco')::integer as cars_without_ac_reported,
      max(visible.created_at) as latest_report_at
    from visible
    group by visible.line
  ),
  index_reports as (
    select
      reports.line,
      reports.car,
      reports.state,
      reports.created_at,
      power(2.0, -(greatest(0.0, extract(epoch from (input_as_of - reports.created_at)) / 86400.0) / 3.0)) as weight,
      case reports.state
        when 'fresco' then 0.0
        when 'calor' then 60.0
        when 'infierno' then 100.0
      end as heat
    from public.reports
    where reports.hidden_at is null
      and reports.created_at >= input_index_start
      and reports.created_at <= input_visible_end
      and (input_lines is null or reports.line = any(input_lines))
  ),
  line_weights as (
    select
      index_reports.line,
      sum(index_reports.weight) as effective_reports,
      sum(index_reports.weight * index_reports.heat) as weighted_heat_total
    from index_reports
    group by index_reports.line
  ),
  car_weights as (
    select
      index_reports.line,
      index_reports.car,
      max(index_reports.weight) as car_weight
    from index_reports
    where index_reports.car is not null
    group by index_reports.line, index_reports.car
  ),
  fleet_weights as (
    select
      car_weights.line,
      sum(car_weights.car_weight) as weighted_cars
    from car_weights
    group by car_weights.line
  ),
  diagnostics as (
    select
      selected_lines.line,
      coalesce(line_weights.effective_reports, 0.0) as effective_reports,
      case
        when coalesce(line_weights.effective_reports, 0.0) = 0 then 0.0
        else line_weights.weighted_heat_total / line_weights.effective_reports
      end as weighted_heat,
      case
        when coalesce(line_weights.effective_reports, 0.0) <= 0 then 0.0
        else 100.0 * (1.0 - power(2.0, -line_weights.effective_reports / 12.0))
      end as report_score,
      least(100.0, 100.0 * coalesce(fleet_weights.weighted_cars, 0.0) / greatest(1, coalesce(line_fleet_estimates.estimated_total_cars, 1))) as weighted_fleet_percentage
    from selected_lines
    left join line_weights on line_weights.line = selected_lines.line
    left join fleet_weights on fleet_weights.line = selected_lines.line
    left join public.line_fleet_estimates on line_fleet_estimates.line = selected_lines.line
  )
  select
    selected_lines.line,
    coalesce(visible_counts.reports, 0) as reports,
    coalesce(visible_counts.fresco_reports, 0) as fresco_reports,
    coalesce(visible_counts.calor_reports, 0) as calor_reports,
    coalesce(visible_counts.infierno_reports, 0) as infierno_reports,
    coalesce(visible_counts.cars_reported, 0) as cars_reported,
    coalesce(visible_counts.cars_without_ac_reported, 0) as cars_without_ac_reported,
    visible_counts.latest_report_at,
    round(((diagnostics.weighted_heat / 100.0) * (
      0.65 * diagnostics.report_score +
      0.35 * (case when diagnostics.weighted_fleet_percentage <= 0 then 0.0 else 100.0 * (1.0 - power(2.0, -diagnostics.weighted_fleet_percentage / 15.0)) end)
    ))::numeric, 2)::double precision as heat_index,
    round(diagnostics.weighted_heat::numeric, 2)::double precision as weighted_heat,
    round(diagnostics.effective_reports::numeric, 2)::double precision as effective_reports,
    round(diagnostics.report_score::numeric, 2)::double precision as report_score,
    round(diagnostics.weighted_fleet_percentage::numeric, 2)::double precision as weighted_fleet_percentage,
    round((case when diagnostics.weighted_fleet_percentage <= 0 then 0.0 else 100.0 * (1.0 - power(2.0, -diagnostics.weighted_fleet_percentage / 15.0)) end)::numeric, 2)::double precision as fleet_score
  from selected_lines
  left join visible_counts on visible_counts.line = selected_lines.line
  left join diagnostics on diagnostics.line = selected_lines.line;
$$;

create or replace function public.dashboard_bucket_counts(
  input_start timestamptz,
  input_end timestamptz,
  input_bucket_seconds integer,
  input_lines text[] default null
)
returns table (
  bucket_start timestamptz,
  line text,
  reports integer
)
language sql
stable
as $$
  select
    to_timestamp(
      extract(epoch from input_start) +
      floor((extract(epoch from reports.created_at) - extract(epoch from input_start)) / input_bucket_seconds) * input_bucket_seconds
    ) as bucket_start,
    reports.line,
    count(*)::integer as reports
  from public.reports
  where reports.hidden_at is null
    and reports.created_at >= input_start
    and reports.created_at <= input_end
    and (input_lines is null or reports.line = any(input_lines))
  group by bucket_start, reports.line;
$$;

create or replace function public.dashboard_car_summaries(
  input_start timestamptz,
  input_end timestamptz,
  input_lines text[] default null
)
returns table (
  car text,
  lines text[],
  reports integer,
  fresco_reports integer,
  calor_reports integer,
  infierno_reports integer
)
language sql
stable
as $$
  select
    reports.car,
    array_agg(distinct reports.line order by reports.line) as lines,
    count(*)::integer as reports,
    count(*) filter (where reports.state = 'fresco')::integer as fresco_reports,
    count(*) filter (where reports.state = 'calor')::integer as calor_reports,
    count(*) filter (where reports.state = 'infierno')::integer as infierno_reports
  from public.reports
  where reports.hidden_at is null
    and reports.car is not null
    and reports.created_at >= input_start
    and reports.created_at <= input_end
    and (input_lines is null or reports.line = any(input_lines))
  group by reports.car
  order by (count(*) filter (where reports.state <> 'fresco')) desc, count(*) desc, reports.car asc;
$$;

create or replace function public.dashboard_car_histories(
  input_start timestamptz,
  input_end timestamptz,
  input_bucket_seconds integer,
  input_lines text[] default null
)
returns table (
  car text,
  bucket_start timestamptz,
  reports integer
)
language sql
stable
as $$
  select
    reports.car,
    to_timestamp(
      extract(epoch from input_start) +
      floor((extract(epoch from reports.created_at) - extract(epoch from input_start)) / input_bucket_seconds) * input_bucket_seconds
    ) as bucket_start,
    count(*)::integer as reports
  from public.reports
  where reports.hidden_at is null
    and reports.car is not null
    and reports.created_at >= input_start
    and reports.created_at <= input_end
    and (input_lines is null or reports.line = any(input_lines))
  group by reports.car, bucket_start;
$$;

create or replace function public.dashboard_car_series(
  input_start timestamptz,
  input_end timestamptz,
  input_lines text[] default null
)
returns table (
  series integer,
  reports integer
)
language sql
stable
as $$
  with report_series as (
    select
      (floor((substring(reports.car from '[0-9]+')::integer) / 1000) * 1000)::integer as series
    from public.reports
    where reports.hidden_at is null
      and reports.car is not null
      and reports.created_at >= input_start
      and reports.created_at <= input_end
      and (input_lines is null or reports.line = any(input_lines))
  )
  select
    report_series.series,
    count(*)::integer as reports
  from report_series
  where report_series.series is not null
  group by report_series.series
  order by series asc;
$$;

create or replace function public.dashboard_worst_hours(
  input_start timestamptz,
  input_end timestamptz,
  input_lines text[] default null
)
returns table (
  madrid_hour integer,
  reports integer
)
language sql
stable
as $$
  select
    extract(hour from reports.created_at at time zone 'Europe/Madrid')::integer as madrid_hour,
    count(*)::integer as reports
  from public.reports
  where reports.hidden_at is null
    and reports.created_at >= input_start
    and reports.created_at <= input_end
    and (input_lines is null or reports.line = any(input_lines))
  group by madrid_hour;
$$;

create or replace function public.dashboard_heat_trend(
  input_range_start timestamptz,
  input_range_end timestamptz,
  input_index_start timestamptz,
  input_bucket_seconds integer,
  input_lines text[] default null,
  input_as_of timestamptz default now()
)
returns table (
  bucket_start timestamptz,
  line text,
  heat_index double precision
)
language sql
stable
as $$
  with lines(line) as (
    values ('L1'), ('L2'), ('L3'), ('L4'), ('L5'), ('L6'), ('L7'), ('L8'), ('L9'), ('L10'), ('L11'), ('L12')
  ),
  selected_lines as (
    select line
    from lines
    where input_lines is null or line = any(input_lines)
  ),
  buckets as (
    select
      bucket_start,
      bucket_start + make_interval(secs => input_bucket_seconds) as bucket_end
    from generate_series(input_range_start, input_range_end, make_interval(secs => input_bucket_seconds)) as series(bucket_start)
    where bucket_start <= input_range_end
  ),
  bucket_lines as (
    select
      buckets.bucket_start,
      least(buckets.bucket_end, input_as_of) as bucket_as_of,
      selected_lines.line
    from buckets
    cross join selected_lines
  ),
  index_reports as (
    select
      bucket_lines.bucket_start,
      bucket_lines.bucket_as_of,
      bucket_lines.line,
      reports.car,
      reports.state,
      power(2.0, -(greatest(0.0, extract(epoch from (bucket_lines.bucket_as_of - reports.created_at)) / 86400.0) / 3.0)) as weight,
      case reports.state
        when 'fresco' then 0.0
        when 'calor' then 60.0
        when 'infierno' then 100.0
      end as heat
    from bucket_lines
    left join public.reports
      on reports.hidden_at is null
      and reports.line = bucket_lines.line
      and reports.created_at >= input_index_start
      and reports.created_at < bucket_lines.bucket_as_of
  ),
  line_weights as (
    select
      index_reports.bucket_start,
      index_reports.line,
      sum(index_reports.weight) filter (where index_reports.state is not null) as effective_reports,
      sum(index_reports.weight * index_reports.heat) filter (where index_reports.state is not null) as weighted_heat_total
    from index_reports
    group by index_reports.bucket_start, index_reports.line
  ),
  car_weights as (
    select
      index_reports.bucket_start,
      index_reports.line,
      index_reports.car,
      max(index_reports.weight) as car_weight
    from index_reports
    where index_reports.car is not null
    group by index_reports.bucket_start, index_reports.line, index_reports.car
  ),
  fleet_weights as (
    select
      car_weights.bucket_start,
      car_weights.line,
      sum(car_weights.car_weight) as weighted_cars
    from car_weights
    group by car_weights.bucket_start, car_weights.line
  ),
  diagnostics as (
    select
      bucket_lines.bucket_start,
      bucket_lines.line,
      coalesce(line_weights.effective_reports, 0.0) as effective_reports,
      case
        when coalesce(line_weights.effective_reports, 0.0) = 0 then 0.0
        else line_weights.weighted_heat_total / line_weights.effective_reports
      end as weighted_heat,
      case
        when coalesce(line_weights.effective_reports, 0.0) <= 0 then 0.0
        else 100.0 * (1.0 - power(2.0, -line_weights.effective_reports / 12.0))
      end as report_score,
      least(100.0, 100.0 * coalesce(fleet_weights.weighted_cars, 0.0) / greatest(1, coalesce(line_fleet_estimates.estimated_total_cars, 1))) as weighted_fleet_percentage
    from bucket_lines
    left join line_weights
      on line_weights.bucket_start = bucket_lines.bucket_start
      and line_weights.line = bucket_lines.line
    left join fleet_weights
      on fleet_weights.bucket_start = bucket_lines.bucket_start
      and fleet_weights.line = bucket_lines.line
    left join public.line_fleet_estimates on line_fleet_estimates.line = bucket_lines.line
  )
  select
    diagnostics.bucket_start,
    diagnostics.line,
    round(((diagnostics.weighted_heat / 100.0) * (
      0.65 * diagnostics.report_score +
      0.35 * (case when diagnostics.weighted_fleet_percentage <= 0 then 0.0 else 100.0 * (1.0 - power(2.0, -diagnostics.weighted_fleet_percentage / 15.0)) end)
    ))::numeric, 2)::double precision as heat_index
  from diagnostics;
$$;

create or replace function public.dashboard_line_car_reports(
  input_start timestamptz,
  input_end timestamptz,
  input_lines text[] default null
)
returns table (
  line text,
  car text,
  reports integer,
  fresco_reports integer,
  calor_reports integer,
  infierno_reports integer
)
language sql
stable
as $$
  select
    reports.line,
    reports.car,
    count(*)::integer as reports,
    count(*) filter (where reports.state = 'fresco')::integer as fresco_reports,
    count(*) filter (where reports.state = 'calor')::integer as calor_reports,
    count(*) filter (where reports.state = 'infierno')::integer as infierno_reports
  from public.reports
  where reports.hidden_at is null
    and reports.car is not null
    and reports.created_at >= input_start
    and reports.created_at <= input_end
    and (input_lines is null or reports.line = any(input_lines))
  group by reports.line, reports.car
  order by reports.line asc, count(*) desc, reports.car asc;
$$;

grant execute on function public.dashboard_line_summaries to anon, authenticated;
grant execute on function public.dashboard_bucket_counts to anon, authenticated;
grant execute on function public.dashboard_car_summaries to anon, authenticated;
grant execute on function public.dashboard_car_histories to anon, authenticated;
grant execute on function public.dashboard_car_series to anon, authenticated;
grant execute on function public.dashboard_worst_hours to anon, authenticated;
grant execute on function public.dashboard_heat_trend to anon, authenticated;
grant execute on function public.dashboard_line_car_reports to anon, authenticated;
