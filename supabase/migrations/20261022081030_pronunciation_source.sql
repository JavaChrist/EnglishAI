-- =========================================================
-- Title:   Pronunciation XP source
-- Project: EnglishAI
-- Date:    2026-10-22
-- Purpose: Allow the Pronunciation module to record XP and
--          comprehensible-input seconds under its own source.
-- =========================================================

alter table public.xp_events
  drop constraint if exists xp_events_source_check;
alter table public.xp_events
  add constraint xp_events_source_check check (
    source in (
      'conversation', 'listening', 'speaking', 'memory', 'review', 'reading',
      'pronunciation'
    )
  );

do $$
declare
  cname text;
begin
  select con.conname into cname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'input_events'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%source%';

  if cname is not null then
    execute format('alter table public.input_events drop constraint %I', cname);
  end if;
end $$;

alter table public.input_events
  add constraint input_events_source_check check (
    source in (
      'conversation', 'listening', 'speaking', 'memory', 'review', 'reading',
      'pronunciation'
    )
  );
