with raw_historic_reports as (
  select
    source_row,
    split_part(row_text, ';', 1) as raw_created_at,
    split_part(row_text, ';', 2) as raw_line,
    split_part(row_text, ';', 3) as raw_car
  from regexp_split_to_table($csv$2026-07-06 08:00;1;
2026-07-06 20:00;1;
2026-07-06 16:00;1;M-2624
2026-07-07 12:00;1;M-2620
2026-07-06 15:00;1;
2026-07-05/06 12:00;1;R-2881
2026-07-06 20:15;1;R-2167
2026-07-06 18:00;1;
2026-07-06 12:00;1;
2026-07-06 08:00;5;R-2899
2026-07-06 21:00;1;M-2340
2026-07-05 11:00;?;R-3055
2026-07-06 18:00;10;M-2304
2026-07-06 14:00;1;
2026-07-06 10:00;1;M-2776
2026-07-06 15:00;?;M-8427
2026-07-06 17:00;6;S-8526
2026-07-06 19:00;6;S-8526
2026-07-06 16:00;5;R-2835
2026-07-06 19:00;1;
2026-06-17 12:00;5?;M-2872
2022-06-16 12:00;6;
2026-06-29 12:00;1;R-2681
2026-06-29 12:00;1;R-2168
2026-06-24 12:00;1;M-2304
2026-07-06 20:00;1;R-2199
2026-07-05 12:00;1;M-2168
2026-05-20 12:00;1;
2026-07-01 12:00;1;M-2502
2026-06-24 12:00;varias;
2026-06-29 12:00;1;
2026-07-06 16:00;6;R-8494
2026-06-25 12:00;1;R-2667
2026-07-03 12:00;5;M-2872
2026-06-29 12:00;5;M-2848
2026-06-27 12:00;1;
2026-07-04 12:00;5;R-2541
2025-05-30 12:00;?;S-3267
2026-07-06 09:00;3;S-3009
2026-07-06 09:00;?;S-3010
2026-07-01 12:00;1;
2026-07-06 13:00;5;M-3073
2026-07-06 17:00;1;M-2643
2026-06-23 12:00;1;R-2575
2026-07-06 17:00;?;
2026-07-03 12:00;1;M-2378
2026-07-02 12:00;5;
2026-04-25 12:00;1;R-2693
2026-07-01 12:00;?;
2026-07-02 12:00;1;M-2168
2026-06-29 16:14;1;M-2676
2026-07-03 12:00;3;S-3201
2026-07-02 12:00;1;
2026-07-01 12:00;7;S-9123
2026-06-29 12:00;10;S-7058
2026-07-06 10:00;3;R-3020
2026-07-06 14:00;1;M-2588
2026-07-06 14:00;1;M-2570
2026-07-06 11:00;1;M-2160
2026-07-03 12:00;1;
2026-07-04 12:00;1;M-2338
2026-07-01 18:00;1;
2026-07-06 12:00;1;M-2676
2026-07-06 16:00;6;S-8639
2026-07-06 19:16;1;R-2553
2026-07-06 14:00;1;M-2156
2026-07-06 12:00;1;R-2321
2026-07-06 21:00;1;M-2728
2026-07-06 17:00;1;R-2693
2026-07-06 19:30;4;
2026-07-06 17:00;11;M-9775
2026-07-06 12:00;6;S-8574
2026-07-06 12:00;5;M-2888
2026-07-05 12:00;3;R-3143
2026-07-05 12:00;5;R-3065
2026-07-05 12:00;1;M-2634
2026-07-04 12:00;1;M-2624
2026-07-05 12:00;6;R-8497
2026-07-05 12:00;1;M-2428
2026-07-04 12:00;1;M-2690
2026-07-04 12:00;1;M-2418
2026-07-04 12:00;1;R-2681
2026-07-04 12:00;3;R-3143
2026-07-04 12:00;1;R-2591
2026-07-04 12:00;?;M-8072
2026-07-04 12:00;1;M-2660
2026-07-04 12:00;9;M-5546
2026-07-04 12:00;4;R-3569
2026-07-04 12:00;1;R-2599
2026-07-05 13:12;1;M-2372
2026-07-04 12:00;1;M-2636
2026-07-03 12:00;6;S-8537
2026-07-03 12:00;5;R-2823
2026-07-03 12:00;5;R-2855
2026-07-03 12:00;6;S-8508
2026-07-03 12:00;11;M-9805
2026-07-03 12:00;1;M-2902
2026-07-03 12:00;R;S-3267
2026-07-03 12:00;5;R-2743
2026-07-03 12:00;1;M-2677
2026-07-03 12:00;1;M-2372
2026-07-03 12:00;1;M-2442
2026-07-03 12:00;1;R-2195
2026-07-03 12:00;5;R-2881
2026-07-03 12:00;1;R-2693
2026-07-03 12:00;1;R-2569
2026-07-04 12:45;1;M-2410
2026-07-03 12:00;3;R-3140
2026-07-03 12:00;1;M-2870
2026-07-03 12:00;1;M-2674
2026-07-03 12:00;5;M-2802
2026-07-03 15:00;5;M-2846
2026-07-03 12:00;1;M-2578
2026-07-03 12:00;1;M-2540
2026-07-03 12:00;1;M-2678
2026-07-03 12:00;1;R-2677
2026-07-02 12:00;1;R-2155
2026-07-03 12:00;1;R-2633
2026-07-03 12:00;1;R-2443
2026-07-02 12:00;5;M-2744
2026-07-02 12:00;5;R-3128
2026-07-02 12:00;1;M-2646
2026-07-02 12:00;5;M-2872
2026-07-02 12:00;?;
2026-07-02 12:00;10;R-7056
2026-07-02 12:00;6;
2026-07-02 12:00;1;R-2627
2026-07-02 12:00;5;M-3174
2026-07-02 12:00;4;M-3529
2026-07-02 12:00;6;M-8594
2026-07-02 12:00;3;S-3201
2026-07-02 12:00;1;M-2634
2026-07-02 12:00;?;M-7006
2026-07-02 12:00;5;M-2870
2026-07-02 15:30;1;R-2499
2026-07-02 12:00;6;M-8601
2026-07-02 12:00;1;R-2653
2026-07-02 12:00;1;M-2678
2026-07-02 12:00;1;M-2336
2026-07-02 12:00;5;R-2901
2026-07-02 12:00;6?;R-8587
2026-07-02 12:00;3;M-3031
2026-07-02 12:00;5;R-3065
2026-07-02 12:00;5;M-2740
2026-07-01 12:00;1;M-2374
2026-07-01 12:00;5;M-2452
2026-07-01 12:00;3;R-3053
2026-07-01 12:00;5;M-2878
2026-07-01 12:00;1;R-2591
2026-07-01 12:00;?;M-3073
2026-07-01 08:36;1;R-2591
2026-07-01 12:00;6;M-8600
2026-07-01 12:00;1;M-2316
2026-07-01 12:00;1;R-2793
2026-07-01 12:00;1;R-2677
2026-07-01 12:00;1;R-2671
2026-07-01 12:00;1;M-2428
2026-07-01 12:00;5;R-2463
2026-07-01 12:00;5;R-2523
2026-07-01 12:00;1;M-2168
2026-07-01 12:00;1;M-2674
2026-07-01 12:00;7;M-9133
2026-07-01 12:00;1;M-2676$csv$, E'\n') with ordinality as csv(row_text, source_row)
  where row_text <> ''
),
normalized_historic_reports as (
  select
    source_row,
    case
      when raw_created_at = '2026-07-05/06 12:00' then '2026-07-06 12:00'
      else raw_created_at
    end as created_at_text,
    nullif(replace(upper(trim(raw_line)), '?', ''), '') as line_token,
    case
      when regexp_replace(upper(trim(raw_car)), '[^A-Z0-9]', '', 'g') ~ '^[A-Z][0-9]{4,5}$'
        then regexp_replace(upper(trim(raw_car)), '[^A-Z0-9]', '', 'g')
      else null
    end as car
  from raw_historic_reports
),
with_explicit_lines as (
  select
    source_row,
    created_at_text,
    case
      when line_token in ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12') then 'L' || line_token
      when line_token = 'R' then 'R'
      else null
    end as explicit_line,
    car
  from normalized_historic_reports
),
with_probable_lines as (
  select
    source_row,
    created_at_text,
    explicit_line,
    car,
    case
      when car is null then null
      when substring(car from 2)::integer between 2000 and 2999 then array['L1', 'L5']
      when substring(car from 2)::integer between 3000 and 3999 then array['L2', 'L3', 'L4', 'L5']
      when substring(car from 2)::integer between 6000 and 6999 then array['L9']
      when substring(car from 2)::integer between 7000 and 7999 then array['L9', 'L10']
      when substring(car from 2)::integer between 8000 and 8999 then array['L6', 'L8', 'L9', 'L10', 'L11', 'L12']
      when substring(car from 2)::integer between 9000 and 9699 then array['L7', 'L9', 'L10', 'L11', 'L12']
      when substring(car from 2)::integer between 9700 and 9799 then array['L7', 'L10', 'L11', 'L12']
      else null
    end as probable_lines
  from with_explicit_lines
),
prepared_historic_reports as (
  select
    source_row,
    created_at_text::timestamp at time zone 'Europe/Madrid' as created_at,
    coalesce(
      nullif(explicit_line, 'R'),
      probable_lines[(mod(abs(hashtext(car)::bigint), cardinality(probable_lines)) + 1)::integer]
    ) as line,
    car
  from with_probable_lines
  where explicit_line is distinct from 'R'
    and (explicit_line is not null or car is not null)
),
scored_historic_reports as (
  select
    created_at,
    line,
    car,
    row_number() over (
      partition by line
      order by abs(hashtext(line || ':' || coalesce(car, '') || ':' || created_at::text || ':' || source_row::text))
    ) as line_random_rank,
    count(*) over (partition by line) as line_report_count
  from prepared_historic_reports
  where line is not null
),
balanced_historic_reports as (
  select
    created_at,
    line,
    car,
    case
      when line_random_rank <= round(line_report_count * 0.30)::integer then 'calor'::public.heat_state
      else 'infierno'::public.heat_state
    end as state
  from scored_historic_reports
)
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
  state,
  created_at,
  'accepted'
from balanced_historic_reports
where line is not null
  and not exists (
    select 1
    from public.reports existing
    where existing.line = balanced_historic_reports.line
      and existing.car is not distinct from balanced_historic_reports.car
      and existing.created_at = balanced_historic_reports.created_at
  );
