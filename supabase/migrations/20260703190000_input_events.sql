-- =========================================================
-- Title:   Comprehensible input events
-- Project: EnglishAI
-- Date:    2026-07-03
-- Purpose: Per-activity log of comprehensible input (in seconds) so we can
--          chart input over time. users_profile.input_seconds stays as the
--          fast cumulative total; this table powers the daily curve.
-- =========================================================

create table if not exists public.input_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (
    source in (
      'conversation', 'listening', 'speaking', 'memory', 'review', 'reading'
    )
  ),
  seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists input_events_user_idx
  on public.input_events (user_id, created_at desc);

alter table public.input_events enable row level security;

drop policy if exists "input_events_select_own" on public.input_events;
create policy "input_events_select_own" on public.input_events
  for select using (auth.uid() = user_id);

drop policy if exists "input_events_insert_own" on public.input_events;
create policy "input_events_insert_own" on public.input_events
  for insert with check (auth.uid() = user_id);
