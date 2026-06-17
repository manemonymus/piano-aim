-- Secure the leaderboard (Option A: DB-level guardrails + RLS lockdown)
--
-- IMPORTANT: run this AFTER deleting any existing rows that violate the
-- new constraints (e.g. the hacked score of 1337). Otherwise the ALTER
-- TABLE below will fail because an existing row breaks the CHECK.
--
--   delete from public.scores where score > 500 or char_length(name) > 20;

-- 1. Plausibility constraints. The game is a 30s timer, +1 per tap, so a
--    few hundred is already superhuman. 500 leaves generous headroom while
--    making values like 1337 impossible. Keep this in sync with MAX_SCORE
--    in the submit-score Edge Function.
alter table public.scores
  add constraint scores_score_range check (score >= 0 and score <= 500),
  add constraint scores_name_len   check (char_length(name) >= 1 and char_length(name) <= 20);

-- 2. Row Level Security: the public (anon) key may READ the leaderboard but
--    may NOT write to it. All writes go through the submit-score Edge
--    Function, which uses the service_role key and bypasses RLS.
alter table public.scores enable row level security;

drop policy if exists "public read scores"   on public.scores;
drop policy if exists "public insert scores"  on public.scores;
drop policy if exists "public update scores"  on public.scores;

create policy "public read scores"
  on public.scores
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policies for anon/authenticated => those writes
-- are denied. service_role (used only inside the Edge Function) bypasses RLS.
