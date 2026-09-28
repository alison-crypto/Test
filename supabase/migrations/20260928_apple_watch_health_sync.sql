-- Apple Watch / Apple Health sync (applied 2026-09-28). Rows are written only
-- by the health-ingest edge function (service role) after it matches a
-- personal sync key; users can read their own rows and manage their own key.
create table public.health_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create table public.health_daily (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  sleep_h numeric, sleep_start timestamptz, sleep_end timestamptz,
  rhr numeric, hrv numeric, source text,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);
create table public.health_workouts (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null, name text,
  start_ts timestamptz not null, end_ts timestamptz,
  duration_s numeric, distance_km numeric, avg_hr numeric, max_hr numeric, energy_kcal numeric,
  source text, updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index health_workouts_user_start on public.health_workouts (user_id, start_ts desc);
alter table public.health_tokens enable row level security;
alter table public.health_daily enable row level security;
alter table public.health_workouts enable row level security;
create policy "own token read"   on public.health_tokens for select using ((select auth.uid()) = user_id);
create policy "own token insert" on public.health_tokens for insert with check ((select auth.uid()) = user_id);
create policy "own token update" on public.health_tokens for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own token delete" on public.health_tokens for delete using ((select auth.uid()) = user_id);
create policy "own daily read"      on public.health_daily for select using ((select auth.uid()) = user_id);
create policy "own daily delete"    on public.health_daily for delete using ((select auth.uid()) = user_id);
create policy "own workouts read"   on public.health_workouts for select using ((select auth.uid()) = user_id);
create policy "own workouts delete" on public.health_workouts for delete using ((select auth.uid()) = user_id);
