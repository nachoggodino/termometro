create type public.heat_state as enum ('fresco', 'calor', 'infierno');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  line text not null check (line in ('L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11','L12')),
  car text,
  state public.heat_state not null,
  created_at timestamptz not null default now(),
  abuse_key text,
  review_status text not null default 'accepted',
  hidden_at timestamptz,
  hidden_reason text
);

create index reports_created_at_idx on public.reports (created_at desc);
create index reports_line_created_at_idx on public.reports (line, created_at desc);
create index reports_car_idx on public.reports (car) where car is not null;
create index reports_abuse_idx on public.reports (abuse_key, created_at desc) where abuse_key is not null;

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  line text not null check (line in ('L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11','L12')),
  active boolean not null default true,
  verified boolean not null default false,
  source text,
  created_at timestamptz not null default now(),
  unique (code, line)
);

create table public.line_fleet_estimates (
  line text primary key check (line in ('L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11','L12')),
  estimated_total_cars integer not null check (estimated_total_cars > 0),
  source text,
  updated_at timestamptz not null default now()
);

alter table public.reports enable row level security;
alter table public.cars enable row level security;
alter table public.line_fleet_estimates enable row level security;

create policy "Public reports are readable"
on public.reports for select
to anon, authenticated
using (hidden_at is null);

create policy "Known cars are readable"
on public.cars for select
to anon, authenticated
using (active = true);

create policy "Fleet estimates are readable"
on public.line_fleet_estimates for select
to anon, authenticated
using (true);
