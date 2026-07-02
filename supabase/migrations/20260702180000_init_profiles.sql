-- =========================================================
-- Title:   Init Profiles (users_profile + language_profile)
-- Project: EnglishAI
-- Date:    2026-07-02
-- Purpose: Base user & language profile tables with RLS,
--          updated_at triggers, and auto-provisioning on signup.
-- =========================================================

-- =========================================================
-- Tables
-- =========================================================

create table if not exists public.users_profile (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  acquisition_index numeric not null default 0,
  xp_total integer not null default 0,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.language_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  goal text,
  accent text not null default 'us' check (accent in ('us', 'uk')),
  voice text not null default 'female' check (voice in ('male', 'female')),
  interests text[] not null default '{}',
  daily_minutes integer not null default 10,
  speaking_confidence integer not null default 3
    check (speaking_confidence between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- updated_at trigger
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_profile_set_updated_at on public.users_profile;
create trigger users_profile_set_updated_at
  before update on public.users_profile
  for each row execute function public.set_updated_at();

drop trigger if exists language_profile_set_updated_at on public.language_profile;
create trigger language_profile_set_updated_at
  before update on public.language_profile
  for each row execute function public.set_updated_at();

-- =========================================================
-- Auto-create a users_profile row when a new auth user signs up
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'first_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.users_profile enable row level security;
alter table public.language_profile enable row level security;

drop policy if exists "users_profile_select_own" on public.users_profile;
create policy "users_profile_select_own" on public.users_profile
  for select using (auth.uid() = id);

drop policy if exists "users_profile_insert_own" on public.users_profile;
create policy "users_profile_insert_own" on public.users_profile
  for insert with check (auth.uid() = id);

drop policy if exists "users_profile_update_own" on public.users_profile;
create policy "users_profile_update_own" on public.users_profile
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "language_profile_select_own" on public.language_profile;
create policy "language_profile_select_own" on public.language_profile
  for select using (auth.uid() = user_id);

drop policy if exists "language_profile_insert_own" on public.language_profile;
create policy "language_profile_insert_own" on public.language_profile
  for insert with check (auth.uid() = user_id);

drop policy if exists "language_profile_update_own" on public.language_profile;
create policy "language_profile_update_own" on public.language_profile
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- Backfill profiles for users created before this migration
-- =========================================================

insert into public.users_profile (id, display_name)
select u.id, u.raw_user_meta_data ->> 'first_name'
from auth.users u
on conflict (id) do nothing;
