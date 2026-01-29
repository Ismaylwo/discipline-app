-- Optional RPC functions for dashboard/stats
-- Run after schema.sql

-- Projects progress
create or replace function public.stats_projects_progress()
returns table (
  project_id uuid,
  title text,
  deadline text,
  total_tasks int,
  done_tasks int,
  progress numeric
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as project_id,
    p.title,
    case when p.deadline is null then null else to_char(p.deadline at time zone 'Asia/Dushanbe', 'YYYY-MM-DD') end as deadline,
    count(t.id)::int as total_tasks,
    count(*) filter (where t.status = 'done')::int as done_tasks,
    case when count(t.id) = 0 then 0 else round(100.0 * (count(*) filter (where t.status = 'done')) / count(t.id), 2) end as progress
  from projects p
  left join tasks t on t.project_id = p.id and t.user_id = auth.uid()
  where p.user_id = auth.uid() and p.status = 'active'
  group by p.id
  order by progress desc, p.created_at desc;
$$;

-- Summary for period
create or replace function public.stats_tasks_summary(start_date date, end_date date)
returns table (
  period_created int,
  period_done int,
  overdue_now int,
  due_today int
)
language sql
security definer
set search_path = public
as $$
  with today as (
    select (now() at time zone 'Asia/Dushanbe')::date as d
  )
  select
    count(*) filter (where t.created_at::date between start_date and end_date)::int as period_created,
    count(*) filter (where t.status = 'done' and t.completed_at::date between start_date and end_date)::int as period_done,
    count(*) filter (where t.status <> 'done' and t.deadline is not null and (t.deadline at time zone 'Asia/Dushanbe')::date < (select d from today))::int as overdue_now,
    count(*) filter (where t.status <> 'done' and t.deadline is not null and (t.deadline at time zone 'Asia/Dushanbe')::date = (select d from today))::int as due_today
  from tasks t
  where t.user_id = auth.uid();
$$;

-- Done per day
create or replace function public.stats_tasks_done_per_day(start_date date, end_date date)
returns table (
  day text,
  done_count int
)
language sql
security definer
set search_path = public
as $$
  with days as (
    select generate_series(start_date, end_date, interval '1 day')::date as d
  )
  select
    to_char(days.d, 'YYYY-MM-DD') as day,
    coalesce(count(t.id), 0)::int as done_count
  from days
  left join tasks t
    on t.user_id = auth.uid()
   and t.status = 'done'
   and t.completed_at is not null
   and t.completed_at::date = days.d
  group by days.d
  order by days.d;
$$;

-- Tasks by category
create or replace function public.stats_tasks_by_category(start_date date, end_date date)
returns table (
  category_name text,
  total int,
  done int
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(c.name, 'Без категории') as category_name,
    count(t.id)::int as total,
    count(*) filter (where t.status = 'done')::int as done
  from tasks t
  left join categories c on c.id = t.category_id and c.user_id = auth.uid()
  where t.user_id = auth.uid()
    and (t.created_at::date between start_date and end_date)
  group by coalesce(c.name, 'Без категории')
  order by total desc;
$$;

-- Habits adherence (percent for period)
create or replace function public.stats_habits_adherence(start_date date, end_date date)
returns table (
  habit_id uuid,
  title text,
  logs int,
  total_days int,
  adherence numeric
)
language sql
security definer
set search_path = public
as $$
  with total as (
    select (end_date - start_date + 1)::int as days
  )
  select
    h.id as habit_id,
    h.title,
    count(l.id)::int as logs,
    (select days from total) as total_days,
    case when (select days from total) = 0 then 0 else round(100.0 * count(l.id) / (select days from total), 2) end as adherence
  from habits h
  left join habit_logs l
    on l.habit_id = h.id and l.user_id = auth.uid()
   and l.log_date between start_date and end_date
  where h.user_id = auth.uid() and h.is_active = true
  group by h.id, h.title
  order by adherence desc, h.created_at desc;
$$;

-- Current streak for a habit (consecutive days ending today)
create or replace function public.stats_habit_current_streak(habit uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  streak int := 0;
  d date := (now() at time zone 'Asia/Dushanbe')::date;
begin
  loop
    exit when streak > 365;
    if exists (select 1 from habit_logs l where l.user_id = auth.uid() and l.habit_id = habit and l.log_date = d) then
      streak := streak + 1;
      d := d - interval '1 day';
    else
      exit;
    end if;
  end loop;
  return streak;
end;
$$;
