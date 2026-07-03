-- =========================================================
-- Title:   Progression & Gamification
-- Project: EnglishAI
-- Date:    2026-07-03
-- Purpose: XP events, achievements (badges), vocabulary items and
--          spaced-repetition reviews, plus streak/awarded tracking.
-- =========================================================

-- =========================================================
-- New columns on existing tables
-- =========================================================

alter table public.users_profile
  add column if not exists last_active_on date;

alter table public.conversations
  add column if not exists progress_awarded boolean not null default false;

-- =========================================================
-- Tables
-- =========================================================

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (
    source in ('conversation', 'listening', 'speaking', 'memory', 'review')
  ),
  amount integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists xp_events_user_idx
  on public.xp_events (user_id, created_at desc);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_key text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

create table if not exists public.vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  term text not null,
  translation text,
  status text not null default 'passive'
    check (status in ('passive', 'active', 'mastered')),
  created_at timestamptz not null default now(),
  unique (user_id, term)
);

create index if not exists vocabulary_items_user_idx
  on public.vocabulary_items (user_id, created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vocabulary_item_id uuid not null
    references public.vocabulary_items (id) on delete cascade,
  due_at timestamptz not null default now(),
  interval_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists reviews_due_idx
  on public.reviews (user_id, due_at);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.xp_events enable row level security;
alter table public.achievements enable row level security;
alter table public.vocabulary_items enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "xp_events_select_own" on public.xp_events;
create policy "xp_events_select_own" on public.xp_events
  for select using (auth.uid() = user_id);

drop policy if exists "xp_events_insert_own" on public.xp_events;
create policy "xp_events_insert_own" on public.xp_events
  for insert with check (auth.uid() = user_id);

drop policy if exists "achievements_select_own" on public.achievements;
create policy "achievements_select_own" on public.achievements
  for select using (auth.uid() = user_id);

drop policy if exists "achievements_insert_own" on public.achievements;
create policy "achievements_insert_own" on public.achievements
  for insert with check (auth.uid() = user_id);

drop policy if exists "vocabulary_items_select_own" on public.vocabulary_items;
create policy "vocabulary_items_select_own" on public.vocabulary_items
  for select using (auth.uid() = user_id);

drop policy if exists "vocabulary_items_insert_own" on public.vocabulary_items;
create policy "vocabulary_items_insert_own" on public.vocabulary_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "vocabulary_items_update_own" on public.vocabulary_items;
create policy "vocabulary_items_update_own" on public.vocabulary_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews_select_own" on public.reviews;
create policy "reviews_select_own" on public.reviews
  for select using (auth.uid() = user_id);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
