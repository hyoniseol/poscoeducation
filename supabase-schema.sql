-- Cafe Finder Supabase schema
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  location text,
  purpose text,
  conditions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.visit_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cafe_name text not null,
  address text,
  purpose text,
  visit_date date not null default current_date,
  work_rating integer check (work_rating between 1 and 5),
  cafe_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.search_history enable row level security;
alter table public.visit_history enable row level security;

drop policy if exists "Users manage own searches" on public.search_history;
create policy "Users manage own searches" on public.search_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own visits" on public.visit_history;
create policy "Users manage own visits" on public.visit_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists search_history_user_created_idx on public.search_history(user_id, created_at desc);
create index if not exists visit_history_user_created_idx on public.visit_history(user_id, created_at desc);
