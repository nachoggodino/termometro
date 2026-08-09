insert into public.line_fleet_estimates (line, estimated_total_cars, source) values
  ('L1', 216, 'peak-hour train/car estimate provided July 2026'),
  ('L2', 76, 'peak-hour train/car estimate provided July 2026'),
  ('L3', 168, 'peak-hour train/car estimate provided July 2026'),
  ('L4', 104, 'peak-hour train/car estimate provided July 2026'),
  ('L5', 192, 'peak-hour train/car estimate provided July 2026'),
  ('L6', 204, 'peak-hour train/car estimate provided July 2026'),
  ('L7', 126, 'peak-hour train/car estimate provided July 2026'),
  ('L8', 48, 'peak-hour train/car estimate provided July 2026'),
  ('L9', 159, 'peak-hour train/car estimate provided July 2026'),
  ('L10', 260, 'peak-hour train/car estimate provided July 2026'),
  ('L11', 15, 'peak-hour train/car estimate provided July 2026'),
  ('L12', 60, 'peak-hour train/car estimate provided July 2026')
on conflict (line) do update set
  estimated_total_cars = excluded.estimated_total_cars,
  source = excluded.source,
  updated_at = now();

insert into public.cars (code, line, verified, source) values
  ('M2001', 'L1', false, 'development seed'),
  ('M2004', 'L1', false, 'development seed'),
  ('R2401', 'L1', false, 'development seed'),
  ('M5002', 'L5', false, 'development seed'),
  ('R5300', 'L5', false, 'development seed'),
  ('M5120', 'L5', false, 'development seed')
on conflict (code, line) do nothing;
