-- Lab results (blood work etc.). Personal health data: never in the app code
-- (static files are public) — only in these tables, readable by the owner
-- after login. Rows are added by Claude from the PDFs the user sends.
create table public.lab_results (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,                 -- '<collected>|<test key>'
  collected date not null,
  lab text,
  panel text not null,
  test_key text not null,           -- stable key to compare over time
  test text not null,
  value numeric,
  value_text text,                  -- Negative / Non-reactive / not in report
  unit text,
  ref_low numeric,
  ref_high numeric,
  ref_text text,
  note text,
  primary key (user_id, id)
);
create index lab_results_user_key on public.lab_results (user_id, test_key, collected desc);
create table public.lab_notes (
  user_id uuid not null references auth.users (id) on delete cascade,
  collected date not null,
  title text,
  summary text not null,
  primary key (user_id, collected)
);
alter table public.lab_results enable row level security;
alter table public.lab_notes enable row level security;
create policy "own labs read"   on public.lab_results for select using ((select auth.uid()) = user_id);
create policy "own labs delete" on public.lab_results for delete using ((select auth.uid()) = user_id);
create policy "own lab notes read" on public.lab_notes for select using ((select auth.uid()) = user_id);
