-- =====================================================================
-- Alison & Darlene  --  Supabase schema (idempotent: safe to re-run)
-- =====================================================================
-- Paste this whole file into Supabase Dashboard → SQL Editor → Run.
-- Re-running is safe; it uses IF NOT EXISTS / CREATE OR REPLACE.
-- =====================================================================

-- ---------- Helper: keep updated_at fresh on UPDATE ------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles --------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth.users row appears.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- body_entries ---------------------------------------------
create table if not exists public.body_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text,
  date date not null,
  person text not null check (person in ('him','her')),
  weight numeric,
  waist numeric,
  chest numeric,
  hips numeric,
  bicep_l numeric,
  bicep_r numeric,
  thigh_l numeric,
  thigh_r numeric,
  rhr numeric,
  notes text,
  photo_paths text[] not null default '{}',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists body_entries_user_date_idx on public.body_entries (user_id, date desc);
create unique index if not exists body_entries_user_client_idx on public.body_entries (user_id, client_id) where client_id is not null;
drop trigger if exists trg_body_entries_updated_at on public.body_entries;
create trigger trg_body_entries_updated_at before update on public.body_entries
  for each row execute function public.set_updated_at();

-- ---------- meal_entries ---------------------------------------------
create table if not exists public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text,
  date date not null,
  slot text,
  meal_key text,
  custom_name text,
  him_kcal numeric,
  him_p numeric,
  her_kcal numeric,
  her_p numeric,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meal_entries_user_date_idx on public.meal_entries (user_id, date desc);
create unique index if not exists meal_entries_user_client_idx on public.meal_entries (user_id, client_id) where client_id is not null;
drop trigger if exists trg_meal_entries_updated_at on public.meal_entries;
create trigger trg_meal_entries_updated_at before update on public.meal_entries
  for each row execute function public.set_updated_at();

-- ---------- training_sessions ----------------------------------------
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text,
  date date not null,
  person text not null check (person in ('him','her')),
  day text,
  day_label text,
  exercises jsonb not null default '[]'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_user_date_idx on public.training_sessions (user_id, date desc);
create unique index if not exists training_user_client_idx on public.training_sessions (user_id, client_id) where client_id is not null;
drop trigger if exists trg_training_updated_at on public.training_sessions;
create trigger trg_training_updated_at before update on public.training_sessions
  for each row execute function public.set_updated_at();

-- ---------- recipe_book (per-recipe rating + cook log) ---------------
create table if not exists public.recipe_book (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id text not null,
  alison_rating int check (alison_rating between 1 and 5),
  darlene_rating int check (darlene_rating between 1 and 5),
  last_cooked date,
  times_made int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

drop trigger if exists trg_recipe_book_updated_at on public.recipe_book;
create trigger trg_recipe_book_updated_at before update on public.recipe_book
  for each row execute function public.set_updated_at();

-- ---------- custom_recipes -------------------------------------------
create table if not exists public.custom_recipes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  meal_type text,
  cuisine text,
  total_time text,
  servings int,
  macros jsonb,
  ingredients jsonb not null default '[]'::jsonb,
  method jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_recipes_user_idx on public.custom_recipes (user_id);
drop trigger if exists trg_custom_recipes_updated_at on public.custom_recipes;
create trigger trg_custom_recipes_updated_at before update on public.custom_recipes
  for each row execute function public.set_updated_at();

-- ---------- fridge_state (per-cell check + note) ---------------------
create table if not exists public.fridge_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  cell_id text not null,
  checked boolean not null default false,
  note text,
  updated_at timestamptz not null default now(),
  primary key (user_id, cell_id)
);

drop trigger if exists trg_fridge_state_updated_at on public.fridge_state;
create trigger trg_fridge_state_updated_at before update on public.fridge_state
  for each row execute function public.set_updated_at();

-- ---------- grocery_state (per-week, per-item check) ------------------
create table if not exists public.grocery_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  week text not null check (week in ('a','b','c','d')),
  item_id text not null,
  checked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, week, item_id)
);

drop trigger if exists trg_grocery_state_updated_at on public.grocery_state;
create trigger trg_grocery_state_updated_at before update on public.grocery_state
  for each row execute function public.set_updated_at();

-- ---------- chores_state ---------------------------------------------
create table if not exists public.chores_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  chore_id text not null,
  checked boolean not null default false,
  note text,
  updated_at timestamptz not null default now(),
  primary key (user_id, chore_id)
);

drop trigger if exists trg_chores_state_updated_at on public.chores_state;
create trigger trg_chores_state_updated_at before update on public.chores_state
  for each row execute function public.set_updated_at();

create table if not exists public.chores_resets (
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null check (section in ('daily','weekly','monthly')),
  last_reset date,
  updated_at timestamptz not null default now(),
  primary key (user_id, section)
);

drop trigger if exists trg_chores_resets_updated_at on public.chores_resets;
create trigger trg_chores_resets_updated_at before update on public.chores_resets
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Row Level Security: every table is locked down to its owner.
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.body_entries      enable row level security;
alter table public.meal_entries      enable row level security;
alter table public.training_sessions enable row level security;
alter table public.recipe_book       enable row level security;
alter table public.custom_recipes    enable row level security;
alter table public.fridge_state      enable row level security;
alter table public.grocery_state     enable row level security;
alter table public.chores_state      enable row level security;
alter table public.chores_resets     enable row level security;

-- Helper: policy that says "auth.uid() owns this row".
do $$
declare
  t text;
  owned_tables text[] := array[
    'body_entries','meal_entries','training_sessions',
    'recipe_book','custom_recipes',
    'fridge_state','grocery_state','chores_state','chores_resets'
  ];
begin
  foreach t in array owned_tables loop
    execute format('drop policy if exists %I on public.%I', t || '_owner_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_delete', t);

    execute format('create policy %I on public.%I for select using (auth.uid() = user_id)',
                   t || '_owner_select', t);
    execute format('create policy %I on public.%I for insert with check (auth.uid() = user_id)',
                   t || '_owner_insert', t);
    execute format('create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
                   t || '_owner_update', t);
    execute format('create policy %I on public.%I for delete using (auth.uid() = user_id)',
                   t || '_owner_delete', t);
  end loop;
end$$;

-- profiles: same idea but keyed on id
drop policy if exists profiles_owner_select on public.profiles;
drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_select on public.profiles for select using (auth.uid() = id);
create policy profiles_owner_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- =====================================================================
-- Storage bucket for body progress photos.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('body-photos', 'body-photos', false)
on conflict (id) do nothing;

-- Photos are stored at path: <auth.uid()>/<photo_id>.jpg
-- Owner-only access via the auth.uid() folder prefix.
drop policy if exists body_photos_owner_select on storage.objects;
drop policy if exists body_photos_owner_insert on storage.objects;
drop policy if exists body_photos_owner_update on storage.objects;
drop policy if exists body_photos_owner_delete on storage.objects;

create policy body_photos_owner_select on storage.objects
  for select using (bucket_id = 'body-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy body_photos_owner_insert on storage.objects
  for insert with check (bucket_id = 'body-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy body_photos_owner_update on storage.objects
  for update using (bucket_id = 'body-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy body_photos_owner_delete on storage.objects
  for delete using (bucket_id = 'body-photos' and auth.uid()::text = (storage.foldername(name))[1]);
