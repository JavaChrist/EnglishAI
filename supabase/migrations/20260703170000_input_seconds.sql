-- =========================================================
-- Title:   Comprehensible input tracking
-- Project: EnglishAI
-- Date:    2026-07-03
-- Purpose: Total seconds of comprehensible input the learner has received
--          (reading + listening + coach speech). In Krashen's model the volume
--          of comprehensible input is the strongest predictor of acquisition,
--          so we track it as a first-class metric.
-- =========================================================

alter table public.users_profile
  add column if not exists input_seconds bigint not null default 0;
