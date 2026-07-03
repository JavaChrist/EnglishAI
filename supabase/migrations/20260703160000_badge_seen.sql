-- =========================================================
-- Title:   Badge "seen" flag, achievements update policy, reading XP
-- Project: EnglishAI
-- Date:    2026-07-03
-- Purpose: 1) Track which unlocked badges were shown (one-time toast).
--          2) Allow updating own achievements (needed to mark them seen).
--          3) Add 'reading' as a valid XP source (Reading Room pillar).
-- Existing achievements default to seen = true (don't re-toast past badges);
-- newly awarded badges are inserted with seen = false.
-- =========================================================

alter table public.achievements
  add column if not exists seen boolean not null default true;

drop policy if exists "achievements_update_own" on public.achievements;
create policy "achievements_update_own" on public.achievements
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.xp_events
  drop constraint if exists xp_events_source_check;
alter table public.xp_events
  add constraint xp_events_source_check check (
    source in (
      'conversation', 'listening', 'speaking', 'memory', 'review', 'reading'
    )
  );
