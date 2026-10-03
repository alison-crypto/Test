-- Body-composition scans, Claude's progress notes, and extra workout detail.
-- Schema only — personal data is inserted directly into the DB, never committed.
-- Owner-only RLS: the app can read/delete its own rows; inserts are done by Claude via SQL.

create table if not exists public.body_scans (
  user_id uuid not null references auth.users(id) on delete cascade,
  measured date not null,
  source text,
  weight_lb numeric, bmi numeric, body_fat_pct numeric, skeletal_muscle_pct numeric,
  fat_free_lb numeric, subq_fat_pct numeric, visceral numeric, water_pct numeric,
  muscle_lb numeric, bone_lb numeric, protein_pct numeric, bmr_kcal numeric,
  metabolic_age numeric, waist_cm numeric, note text,
  primary key (user_id, measured)
);
alter table public.body_scans enable row level security;
create policy "own scans read" on public.body_scans for select using ((select auth.uid()) = user_id);
create policy "own scans delete" on public.body_scans for delete using ((select auth.uid()) = user_id);

create table if not exists public.progress_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('body', 'workouts')),
  noted date not null,
  title text,
  summary text not null,
  primary key (user_id, kind, noted)
);
alter table public.progress_notes enable row level security;
create policy "own progress notes read" on public.progress_notes for select using ((select auth.uid()) = user_id);

alter table public.health_workouts
  add column if not exists active_kcal numeric,
  add column if not exists effort integer,
  add column if not exists cadence_spm numeric,
  add column if not exists elev_m numeric,
  add column if not exists place text,
  add column if not exists note text;
