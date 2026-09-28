-- The app upserts with on_conflict=user_id,client_id. Postgres can't use a
-- PARTIAL unique index (WHERE client_id IS NOT NULL) for that, so every sync
-- of training sessions, body entries and meals failed with 400 (42P10).
-- A full unique constraint behaves the same (NULL client_ids never clash).
drop index if exists public.training_user_client_idx;
drop index if exists public.body_entries_user_client_idx;
drop index if exists public.meal_entries_user_client_idx;
alter table public.training_sessions add constraint training_sessions_user_client_key unique (user_id, client_id);
alter table public.body_entries      add constraint body_entries_user_client_key      unique (user_id, client_id);
alter table public.meal_entries      add constraint meal_entries_user_client_key      unique (user_id, client_id);
