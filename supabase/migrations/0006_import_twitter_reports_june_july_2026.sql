create temp table twitter_reports_june_july_2026 on commit drop as
with raw_twitter_reports as (
  select
    source_row,
    split_part(row_text, ';', 1) as raw_created_at,
    split_part(row_text, ';', 2) as raw_line,
    split_part(row_text, ';', 3) as raw_car
  from regexp_split_to_table($csv$2026-06-01 15:26;9;S-9435
2026-06-01 20:15;9;R-9437
2026-06-02 09:49;5;R-2819
2026-06-02 10:08;3;R-3065
2026-06-02 20:02;3;M-3174
2026-06-02 11:30;1;R-2155
2026-06-02 19:30;5;R-3068
2026-06-04 19:02;1;R-2167
2026-06-04 18:04;5;M-2872
2026-06-04 17:20;1;R-2595
2026-06-04 16:44;9;S-9442
2026-06-06 11:33;1;R-2433
2026-06-06 13:27;3;R-3098
2026-06-06 09:27;1;R-2667
2026-06-07 20:11;1;R-2155
2026-06-08 15:59;5;M-2740
2026-06-08 12:57;1;M-2680
2026-06-09 13:49;5;M-2368
2026-06-09 09:36;1;R-2375
2026-06-10 12:47;1;R-2403
2026-06-10 15:25;5;M-2798
2026-06-12 18:19;1;M-2364
2026-06-12 18:20;5;M-2902
2026-06-13 17:13;2;M-3258
2026-06-14 19:49;5;R-2667
2026-06-14 13:25;?;
2026-06-15 20:24;5;M-2872
2026-06-15 14:11;6;M-8624
2026-06-16 16:19;6;M-8558
2026-06-16 20:16;1;R-2649
2026-06-16 16:24;1;M-2376
2026-06-16 10:45;1;M-2116
2026-06-17 12:54;5;M-2872
2026-06-17 15:51;1;R-2303
2026-06-18 13:09;5;M-2892
2026-06-18 18:20;1;M-2646
2026-06-18 12:04;1;R-2417
2026-06-18 09:02;1;M-2304
2026-06-18 15:27;1;R-2155
2026-06-19 15:05;5;R-2747
2026-06-19 14:24;9;M-5548
2026-06-19 13:59;2;R-3293
2026-06-19 14:09;1;M-2152
2026-06-20 19:37;5;M-3067
2026-06-21 20:57;1;M-2372
2026-06-22 12:22;1;M-2378
2026-06-22 11:57;1;R-2665
2026-06-22 12:26;5;M-2866
2026-06-22 10:54;1;M-2378
2026-06-23 14:04;5;M-3174
2026-06-23 09:29;1;R-2337
2026-06-23 09:48;1;R-2575
2026-06-23 13:53;1;M-2168
2026-06-23 16:16;1;R-2403
2026-06-23 13:41;1;M-2168
2026-06-23 12:51;1;R-2575
2026-06-23 17:07;1;M-2168
2026-06-23 13:57;5;R-2901
2026-06-23 18:27;5;R-2873
2026-06-23 14:21;5;M-3174
2026-06-23 20:56;1;M-2358
2026-06-23 13:59;1;M-2168
2026-06-24 13:38;1;M-2304
2026-06-24 18:52;5;R-2693
2026-06-24 10:02;1;M-2666
2026-06-24 18:55;1;M-2414
2026-06-24 09:31;2;M-3703
2026-06-24 15:55;1;R-2503
2026-06-25 16:53;1;M-2378
2026-06-25 13:16;1;R-2677
2026-06-25 18:56;10;S-7094
2026-06-25 10:21;5;R-2795
2026-06-25 13:38;11;M-9745
2026-06-25 11:50;6;S-8622
2026-06-26 09:38;6;M-8601
2026-06-27 10:00;1;R-2427
2026-06-27 19:05;1;R-2361
2026-06-28 20:38;1;M-2676
2026-06-28 14:24;5;R-2465
2026-06-28 11:36;1;M-2434
2026-06-29 13:38;1;R-2667
2026-06-29 16:55;2;M-3258
2026-06-29 18:40;?;M-3265
2026-06-29 14:42;1;R-2155
2026-06-29 14:03;1;M-2676
2026-06-29 15:47;1;R-2599
2026-06-29 14:54;1;M-2774
2026-06-29 16:05;6;M-8474
2026-06-30 19:10;1;
2026-06-30 14:45;1;M-2116
2026-06-30 14:16;1;M-2648
2026-06-30 18:50;5;R-2523
2026-06-30 09:33;?;R-7056
2026-06-30 18:41;3;S-3004
2026-06-30 12:38;?;M-3073
2026-06-30 15:12;1;R-2681
2026-06-30 15:26;6;R-8575
2026-06-30 17:23;5;M-2872
2026-06-30 10:31;7;S-9123
2026-06-30 12:33;1;R-2155
2026-06-30 09:10;1;M-2689
2026-06-30 18:48;1;M-2666
2026-06-30 17:32;5;M-2740
2026-06-30 10:38;1;M-2774
2026-06-30 17:48;5;M-2874
2026-06-30 10:46;1;R-2347
2026-06-30 09:28;1;M-2600
2026-06-30 14:43;1;R-2623
2026-06-30 15:20;3;S-3124
2026-06-30 14:10;1;R-2587
2026-06-30 12:39;1;R-2191
2026-06-30 13:38;5;R-2523
2026-06-30 14:53;1;M-2168
2026-06-30 15:58;5;R-2829
2026-06-30 13:09;1;M-2434
2026-06-30 16:45;1;R-2575
2026-06-30 10:24;5;R-2675
2026-06-30 09:25;1;M-2624
2026-06-30 10:53;6;M-8594
2026-06-30 12:01;3;
2026-06-30 15:02;3;S-3124
2026-06-30 16:40;1;R-2415
2026-06-30 09:51;5;M-2606
2026-06-30 18:22;?;M-8211
2026-06-30 12:40;4;S-3507
2026-06-30 09:53;1;
2026-06-30 16:48;5;M-2774
2026-06-30 19:28;3;R-3212
2026-06-30 09:52;1;M-2540
2026-06-30 15:24;1;R-2599
2026-06-30 11:19;5;M-2866
2026-06-30 13:11;5;M-2466
2026-06-30 18:17;1;M-2624
2026-06-30 15:34;?;M-3696
2026-06-30 09:39;1;R-2427
2026-06-30 10:43;5;R-2465
2026-06-30 09:58;10;M-7096
2026-06-30 19:41;1;R-2587
2026-06-30 14:52;5;M-2728
2026-06-30 20:16;1;R-2503
2026-07-07 15:00;1;M-2134
2026-07-07 16:00;5;M-2882
2026-07-07 09:00;1;R-2609
2026-07-07 15:00;5;M-2870
2026-07-07 18:00;5;R-2881
2026-07-07 08:00;1;R-2155
2026-07-07 14:56;5;M-2540
2026-07-07 19:50;5;R-2863
2026-07-07 08:00;1;M-2168
2026-07-07 17:00;11;M-9775
2026-07-07 19:00;1;M-2322
2026-07-07 16:00;3;M-3030
2026-07-07 19:00;1;R-2451
2026-07-07 19:00;5;R-2463
2026-07-07 09:00;1;M-2156
2026-07-07 16:00;1;R-2321
2026-07-07 16:00;6;S-8495
2026-07-07 16:00;5;S-3165$csv$, E'\n') with ordinality as csv(row_text, source_row)
  where row_text <> ''
),
normalized_twitter_reports as (
  select
    source_row,
    raw_created_at,
    nullif(replace(upper(trim(raw_line)), '?', ''), '') as line_token,
    case
      when regexp_replace(upper(trim(raw_car)), '[^A-Z0-9]', '', 'g') ~ '^[A-Z][0-9]{4,5}$'
        then regexp_replace(upper(trim(raw_car)), '[^A-Z0-9]', '', 'g')
      else null
    end as car
  from raw_twitter_reports
),
with_probable_lines as (
  select
    source_row,
    raw_created_at,
    case
      when line_token in ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12') then 'L' || line_token
      when line_token = 'R' then 'R'
      else null
    end as explicit_line,
    car,
    case
      when car is null then null
      when substring(car from 2)::integer between 2000 and 2999 then array['L1', 'L5']
      when substring(car from 2)::integer between 3000 and 3999 then array['L2', 'L3', 'L4', 'L5', 'R']
      when substring(car from 2)::integer between 6000 and 6999 then array['L9']
      when substring(car from 2)::integer between 7000 and 7999 then array['L9', 'L10']
      when substring(car from 2)::integer between 8000 and 8999 then array['L6', 'L8', 'L9', 'L10', 'L11', 'L12']
      when substring(car from 2)::integer between 9000 and 9699 then array['L7', 'L9', 'L10', 'L11', 'L12']
      when substring(car from 2)::integer between 9700 and 9799 then array['L7', 'L10', 'L11', 'L12']
      else null
    end as probable_lines
  from normalized_twitter_reports
),
prepared_twitter_reports as (
  select
    raw_created_at::timestamp at time zone 'Europe/Madrid' as created_at,
    coalesce(
      nullif(explicit_line, 'R'),
      probable_lines[(mod(substring(car from 2)::integer, cardinality(probable_lines)) + 1)::integer]
    ) as line,
    car,
    source_row
  from with_probable_lines
  where explicit_line is distinct from 'R'
    and (explicit_line is not null or car is not null)
)
select
  created_at,
  line,
  car,
  source_row
from prepared_twitter_reports
where line is not null
  and line <> 'R';

insert into public.reports (
  line,
  car,
  state,
  created_at,
  review_status
)
select
  line,
  car,
  'infierno'::public.heat_state,
  created_at,
  'accepted'
from twitter_reports_june_july_2026 imported
where not exists (
  select 1
  from public.reports existing
  where existing.line = imported.line
    and existing.car is not distinct from imported.car
    and existing.created_at = imported.created_at
);

insert into public.cars (
  code,
  line,
  verified,
  source
)
select distinct
  car,
  line,
  false,
  'twitter import june-july 2026'
from twitter_reports_june_july_2026
where car is not null
on conflict (code, line) do update set
  active = true,
  source = coalesce(public.cars.source, excluded.source);
