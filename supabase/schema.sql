-- Discipline MVP schema (Supabase Postgres)
-- Run in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Helper: updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  description text,
  deadline timestamptz,
  status text not null default 'active', -- active/archived
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  description text,
  deadline timestamptz,
  priority int not null default 2, -- 1..3
  status text not null default 'todo', -- todo/doing/done
  completed_at timestamptz,
  category_id uuid references public.categories(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subtasks
create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

-- Habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Habit logs (date-only)
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null,
  value int not null default 1,
  created_at timestamptz not null default now(),
  unique (user_id, habit_id, log_date)
);

-- Notes
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  content text not null default '',
  pinned boolean not null default false,
  category_id uuid references public.categories(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers for updated_at
drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at before update on public.notes
for each row execute function public.set_updated_at();

-- Indexes
create index if not exists idx_tasks_user_deadline on public.tasks(user_id, deadline);
create index if not exists idx_tasks_user_status on public.tasks(user_id, status);
create index if not exists idx_tasks_user_project on public.tasks(user_id, project_id);
create index if not exists idx_tasks_user_category on public.tasks(user_id, category_id);

create index if not exists idx_projects_user_status on public.projects(user_id, status);
create index if not exists idx_notes_user_pinned on public.notes(user_id, pinned);

create index if not exists idx_habit_logs_user_habit_date on public.habit_logs(user_id, habit_id, log_date);

-- Enable RLS
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.notes enable row level security;

-- RLS Policies (owner-only)
-- Categories
drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories for select using (user_id = auth.uid());
drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories for insert with check (user_id = auth.uid());
drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories for delete using (user_id = auth.uid());

-- Projects
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects for select using (user_id = auth.uid());
drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects for insert with check (user_id = auth.uid());
drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects for delete using (user_id = auth.uid());

-- Tasks
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select using (user_id = auth.uid());
drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks for insert with check (user_id = auth.uid());
drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks for delete using (user_id = auth.uid());

-- Subtasks
drop policy if exists "subtasks_select_own" on public.subtasks;
create policy "subtasks_select_own" on public.subtasks for select using (user_id = auth.uid());
drop policy if exists "subtasks_insert_own" on public.subtasks;
create policy "subtasks_insert_own" on public.subtasks for insert with check (user_id = auth.uid());
drop policy if exists "subtasks_update_own" on public.subtasks;
create policy "subtasks_update_own" on public.subtasks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "subtasks_delete_own" on public.subtasks;
create policy "subtasks_delete_own" on public.subtasks for delete using (user_id = auth.uid());

-- Habits
drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own" on public.habits for select using (user_id = auth.uid());
drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own" on public.habits for insert with check (user_id = auth.uid());
drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own" on public.habits for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own" on public.habits for delete using (user_id = auth.uid());

-- Habit logs
drop policy if exists "habit_logs_select_own" on public.habit_logs;
create policy "habit_logs_select_own" on public.habit_logs for select using (user_id = auth.uid());
drop policy if exists "habit_logs_insert_own" on public.habit_logs;
create policy "habit_logs_insert_own" on public.habit_logs for insert with check (user_id = auth.uid());
drop policy if exists "habit_logs_update_own" on public.habit_logs;
create policy "habit_logs_update_own" on public.habit_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "habit_logs_delete_own" on public.habit_logs;
create policy "habit_logs_delete_own" on public.habit_logs for delete using (user_id = auth.uid());

-- Notes
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes for select using (user_id = auth.uid());
drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes for insert with check (user_id = auth.uid());
drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes for delete using (user_id = auth.uid());
