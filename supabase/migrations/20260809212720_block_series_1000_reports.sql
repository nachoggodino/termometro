alter table public.reports
  add constraint reports_car_series_1000_retired_check
  check (
    hidden_at is not null
    or car is null
    or substring(car from '[0-9]+')::integer not between 1000 and 1999
  ) not valid;

alter table public.cars
  add constraint cars_active_series_1000_retired_check
  check (
    not active
    or substring(code from '[0-9]+')::integer not between 1000 and 1999
  ) not valid;

create or replace function public.create_report(
  input_line text,
  input_car text,
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
  state public.heat_state,
  created_at timestamptz,
  hidden_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_report public.reports%rowtype;
begin
  if input_car is not null
    and substring(input_car from '[0-9]+')::integer between 1000 and 1999 then
    return query select false, 'retired_series'::text, null::uuid, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
    return;
  end if;

  if input_abuse_key is not null then
    perform pg_advisory_xact_lock(hashtext('rate:' || input_abuse_key));

    if (
      select count(*)
      from public.reports
      where reports.abuse_key = input_abuse_key
        and reports.created_at >= input_rate_limit_start
    ) >= input_rate_limit_max then
      return query select false, 'rate_limited'::text, null::uuid, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
      return;
    end if;
  end if;

  if input_car is null then
    if input_abuse_key is not null and exists (
      select 1
      from public.reports
      where reports.abuse_key = input_abuse_key
        and reports.car is null
        and reports.created_at >= input_now - interval '30 minutes'
        and reports.hidden_at is null
      limit 1
    ) then
      return query select false, 'duplicate'::text, null::uuid, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
      return;
    end if;

    perform pg_advisory_xact_lock(hashtext('duplicate:no-car:' || input_line));

    if exists (
      select 1
      from public.reports
      where reports.line = input_line
        and reports.car is null
        and reports.created_at >= input_duplicate_window_start
        and reports.hidden_at is null
      limit 1
    ) then
      return query select false, 'duplicate'::text, null::uuid, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
      return;
    end if;
  end if;

  if input_car is not null then
    perform pg_advisory_xact_lock(hashtext('duplicate:' || input_line || ':' || input_car || ':' || input_state::text));

    if exists (
      select 1
      from public.reports
      where reports.line = input_line
        and reports.state = input_state
        and reports.created_at >= input_duplicate_window_start
        and reports.hidden_at is null
        and reports.car = input_car
      limit 1
    ) then
      return query select false, 'duplicate'::text, null::uuid, null::text, null::text, null::public.heat_state, null::timestamptz, null::timestamptz;
      return;
    end if;
  end if;

  insert into public.reports (
    line,
    car,
    state,
    abuse_key,
    undo_token_hash,
    undo_expires_at,
    created_at
  )
  values (
    input_line,
    input_car,
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
      inserted_report.state,
      inserted_report.created_at,
      inserted_report.hidden_at;
end;
$$;

revoke all on function public.create_report(text, text, public.heat_state, text, text, timestamptz, timestamptz, timestamptz, integer, timestamptz) from public;
revoke execute on function public.create_report(text, text, public.heat_state, text, text, timestamptz, timestamptz, timestamptz, integer, timestamptz) from anon, authenticated;
grant execute on function public.create_report(text, text, public.heat_state, text, text, timestamptz, timestamptz, timestamptz, integer, timestamptz) to service_role;
