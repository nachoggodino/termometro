insert into private.dashboard_report_hourly (
  hour_start, line, car_key, car_series, state, report_count, decay_weight_sum, latest_report_at
)
select
  date_trunc('hour', created_at),
  line,
  coalesce(car, ''),
  case
    when car is null or car !~ '[0-9]+' then null
    else (substring(car from '[0-9]+')::integer / 1000) * 1000
  end,
  state,
  count(*)::integer,
  sum(power(2.0, extract(epoch from (created_at - timestamptz '2020-01-01 00:00:00+00')) / 259200.0)),
  max(created_at)
from public.reports
where hidden_at is null
group by 1, 2, 3, 4, 5
on conflict (hour_start, line, car_key, state) do nothing;

insert into private.dashboard_migration_state (name)
values ('dashboard_v2_backfill');
