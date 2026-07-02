-- =========================================================
-- Title:   Conversations & Messages
-- Project: EnglishAI
-- Date:    2026-07-02
-- Purpose: Store Conversation Lab sessions and their messages,
--          with RLS scoped to the owning user.
-- =========================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists conversations_user_id_idx
  on public.conversations (user_id, created_at desc);

create table if not exists public.conversation_messages (
  id text primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists conversation_messages_conversation_idx
  on public.conversation_messages (conversation_id, created_at);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own" on public.conversations
  for select using (auth.uid() = user_id);

drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own" on public.conversations
  for insert with check (auth.uid() = user_id);

drop policy if exists "conversations_update_own" on public.conversations;
create policy "conversations_update_own" on public.conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "conversation_messages_select_own" on public.conversation_messages;
create policy "conversation_messages_select_own" on public.conversation_messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "conversation_messages_insert_own" on public.conversation_messages;
create policy "conversation_messages_insert_own" on public.conversation_messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
