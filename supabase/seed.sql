insert into public.line_fleet_estimates (line, estimated_total_cars, source) values
  ('L1', 80, 'development estimate'),
  ('L2', 48, 'development estimate'),
  ('L3', 55, 'development estimate'),
  ('L4', 44, 'development estimate'),
  ('L5', 72, 'development estimate'),
  ('L6', 90, 'development estimate'),
  ('L7', 56, 'development estimate'),
  ('L8', 30, 'development estimate'),
  ('L9', 62, 'development estimate'),
  ('L10', 76, 'development estimate'),
  ('L11', 24, 'development estimate'),
  ('L12', 50, 'development estimate')
on conflict (line) do update set estimated_total_cars = excluded.estimated_total_cars;

insert into public.cars (code, line, verified, source) values
  ('M-1001', 'L1', false, 'development seed'),
  ('M-1004', 'L1', false, 'development seed'),
  ('R-2401', 'L1', false, 'development seed'),
  ('M-5002', 'L5', false, 'development seed'),
  ('R-5300', 'L5', false, 'development seed'),
  ('M-5120', 'L5', false, 'development seed')
on conflict (code, line) do nothing;
