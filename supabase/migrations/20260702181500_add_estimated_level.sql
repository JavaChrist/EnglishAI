-- =========================================================
-- Title:   Add continuous estimated_level (Krashen i+1)
-- Project: EnglishAI
-- Date:    2026-07-02
-- Purpose: Continuous difficulty cursor (0–100) that drives the
--          i+1 adaptation. CEFR level becomes only informational.
-- =========================================================

alter table public.language_profile
  add column if not exists estimated_level numeric not null default 25
    check (estimated_level >= 0 and estimated_level <= 100),
  add column if not exists difficulty_updated_at timestamptz not null default now();
