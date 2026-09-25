-- Launch Check accounts: one table of saved projects, readable and writable
-- only by the person who owns them. Run this in a Supabase project, enable
-- the Google provider (and/or email links) under Authentication, then put the
-- project URL and publishable key in launch-check/config.js.

create table if not exists public.launch_check_projects (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default 'My app',
  summary text not null default '',
  answers jsonb not null default '{}'::jsonb,
  done jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists launch_check_projects_user_id_idx on public.launch_check_projects (user_id);

alter table public.launch_check_projects enable row level security;

create policy "Owners read their projects" on public.launch_check_projects
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners add projects" on public.launch_check_projects
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners update their projects" on public.launch_check_projects
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners delete their projects" on public.launch_check_projects
  for delete to authenticated using ((select auth.uid()) = user_id);
