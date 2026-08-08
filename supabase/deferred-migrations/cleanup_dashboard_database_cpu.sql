do $$
begin
  if not exists (
    select 1 from private.dashboard_migration_state where name = 'dashboard_v2_backfill'
  ) or exists (
    select 1
    from (values
      ('public.dashboard_bucket_counts_v2(timestamp with time zone,timestamp with time zone,integer,text[],integer[])'),
      ('public.dashboard_car_summaries_v2(timestamp with time zone,timestamp with time zone,text[],integer[],text)'),
      ('public.dashboard_car_histories_v2(timestamp with time zone,timestamp with time zone,integer,text[],integer[],text)'),
      ('public.dashboard_car_series_v2(timestamp with time zone,timestamp with time zone,text[],integer[])'),
      ('public.dashboard_worst_hours_v2(timestamp with time zone,timestamp with time zone,text[],integer[])'),
      ('public.dashboard_line_car_reports_v2(timestamp with time zone,timestamp with time zone,text[],integer[])'),
      ('public.dashboard_line_summaries_v2(timestamp with time zone,timestamp with time zone,timestamp with time zone,text[],integer[],timestamp with time zone)'),
      ('public.dashboard_heat_trend_v2(timestamp with time zone,timestamp with time zone,timestamp with time zone,integer,text[],integer[],timestamp with time zone)'),
      ('public.dashboard_home_snapshot(timestamp with time zone,timestamp with time zone,integer)')
    ) as required(signature)
    where to_regprocedure(required.signature) is null
  ) then
    raise exception 'Dashboard V2 expansion is incomplete; cleanup aborted';
  end if;
end;
$$;

drop function public.dashboard_line_summaries(timestamptz, timestamptz, timestamptz, text[], timestamptz);
drop function public.dashboard_bucket_counts(timestamptz, timestamptz, integer, text[]);
drop function public.dashboard_car_summaries(timestamptz, timestamptz, text[]);
drop function public.dashboard_car_histories(timestamptz, timestamptz, integer, text[]);
drop function public.dashboard_car_series(timestamptz, timestamptz, text[]);
drop function public.dashboard_worst_hours(timestamptz, timestamptz, text[]);
drop function public.dashboard_heat_trend(timestamptz, timestamptz, timestamptz, integer, text[], timestamptz);
drop function public.dashboard_line_car_reports(timestamptz, timestamptz, text[]);

revoke select (id, line, car, state, created_at, hidden_at) on public.reports from anon, authenticated;
revoke select (id, code, line, active, verified, source, created_at) on public.cars from anon, authenticated;
revoke select on public.line_fleet_estimates from anon, authenticated;
drop policy if exists "Public reports are readable" on public.reports;
drop policy if exists "Known cars are readable" on public.cars;
drop policy if exists "Fleet estimates are readable" on public.line_fleet_estimates;

drop table private.dashboard_migration_state;
