-- =========================================================
-- Title:   Reset estimated_level (one-off correction)
-- Project: EnglishAI
-- Purpose: The old adaptation engine could over-inflate the Krashen i+1
--          cursor (e.g. jumping to C2). Run this ONCE to reset every
--          learner's estimated_level back to their onboarding estimate
--          (self-reported CEFR + speaking confidence). The new engine then
--          adapts gently from there, anchored to real production.
-- Safe to run in the Supabase SQL editor. Re-running just re-resets.
-- =========================================================

update public.language_profile
set
  estimated_level =
    greatest(
      0,
      least(
        100,
        (
          case level
            when 'A1' then 10
            when 'A2' then 25
            when 'B1' then 45
            when 'B2' then 60
            when 'C1' then 78
            when 'C2' then 92
            else 25
          end
        )
        + (least(greatest(coalesce(speaking_confidence, 3), 1), 5) - 3) * 2
      )
    ),
  difficulty_updated_at = now();
