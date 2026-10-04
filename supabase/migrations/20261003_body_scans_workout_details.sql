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

-- 2026-10-04 · weekly check-in: tape measurements (inches) + progress photos
-- (files in the existing private body-photos bucket, <uid>/<date>/<pose>.jpg).
create table if not exists public.body_measures (
  user_id uuid not null references auth.users(id) on delete cascade,
  measured date not null,
  calf_r numeric, calf_l numeric, thigh_r numeric, thigh_l numeric,
  hips numeric, waist numeric, chest numeric,
  bicep_l numeric, bicep_r numeric, forearm_l numeric, forearm_r numeric,
  shoulders numeric, neck numeric,
  note text,
  updated_at timestamptz not null default now(),
  primary key (user_id, measured)
);
alter table public.body_measures enable row level security;
create policy "own measures read" on public.body_measures for select using ((select auth.uid()) = user_id);
create policy "own measures insert" on public.body_measures for insert with check ((select auth.uid()) = user_id);
create policy "own measures update" on public.body_measures for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own measures delete" on public.body_measures for delete using ((select auth.uid()) = user_id);

create table if not exists public.progress_photos (
  user_id uuid not null references auth.users(id) on delete cascade,
  taken date not null,
  pose text not null check (pose in ('front','side_r','back','side_l','front_flex','side_r_flex','back_flex','side_l_flex')),
  path text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, taken, pose)
);
alter table public.progress_photos enable row level security;
create policy "own photos read" on public.progress_photos for select using ((select auth.uid()) = user_id);
create policy "own photos insert" on public.progress_photos for insert with check ((select auth.uid()) = user_id);
create policy "own photos update" on public.progress_photos for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own photos delete" on public.progress_photos for delete using ((select auth.uid()) = user_id);

alter table public.progress_notes drop constraint progress_notes_kind_check;
alter table public.progress_notes add constraint progress_notes_kind_check check (kind in ('body', 'workouts', 'checkin'));
