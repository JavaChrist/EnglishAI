import { evaluateBadges } from "@/lib/progress/badges";
import type { createClient } from "@/lib/supabase/server";
import type { XpSource } from "@/types/database";
import { XP_REWARDS } from "@/lib/constants";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Insert an XP event and increment the running total. */
export async function addXp(
  supabase: SupabaseServerClient,
  userId: string,
  source: XpSource,
  amount: number,
): Promise<void> {
  if (amount <= 0) return;
  await supabase
    .from("xp_events")
    .insert({ user_id: userId, source, amount });

  const { data } = await supabase
    .from("users_profile")
    .select("xp_total")
    .eq("id", userId)
    .maybeSingle();

  await supabase
    .from("users_profile")
    .update({ xp_total: Number(data?.xp_total ?? 0) + amount })
    .eq("id", userId);
}

/** Add to the learner's lifetime comprehensible-input counter (in seconds). */
export async function addInputSeconds(
  supabase: SupabaseServerClient,
  userId: string,
  seconds: number,
  source: XpSource,
): Promise<void> {
  const s = Math.round(seconds);
  if (s <= 0) return;

  // Per-activity log (powers the daily input curve).
  await supabase
    .from("input_events")
    .insert({ user_id: userId, source, seconds: s });

  // Fast cumulative total on the profile.
  const { data } = await supabase
    .from("users_profile")
    .select("input_seconds")
    .eq("id", userId)
    .maybeSingle();
  await supabase
    .from("users_profile")
    .update({ input_seconds: Number(data?.input_seconds ?? 0) + s })
    .eq("id", userId);
}

/**
 * Update the daily streak (once per day) and recompute the Acquisition Index.
 * Idempotent within the same UTC day.
 */
export async function touchDailyStreak(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<void> {
  const { data: profile } = await supabase
    .from("users_profile")
    .select("streak_current, streak_longest, last_active_on")
    .eq("id", userId)
    .maybeSingle();

  const { data: lang } = await supabase
    .from("language_profile")
    .select("estimated_level")
    .eq("user_id", userId)
    .maybeSingle();

  const today = isoDate(0);
  const last = (profile?.last_active_on as string | null) ?? null;

  let streak = Number(profile?.streak_current ?? 0);
  if (last !== today) {
    streak = last === isoDate(-1) ? streak + 1 : 1;
  }
  const streakLongest = Math.max(Number(profile?.streak_longest ?? 0), streak);
  const level = Number(lang?.estimated_level ?? 25);
  const acquisitionIndex = clamp(
    Math.round(level * 0.8 + Math.min(streak, 10) * 2),
    0,
    100,
  );

  await supabase
    .from("users_profile")
    .update({
      streak_current: streak,
      streak_longest: streakLongest,
      last_active_on: today,
      acquisition_index: acquisitionIndex,
    })
    .eq("id", userId);
}

/**
 * Grant progression for a conversation exactly once (idempotent).
 * XP + streak + Acquisition Index + "first conversation" badge.
 */
export async function awardConversationProgress(
  supabase: SupabaseServerClient,
  userId: string,
  conversationId: string,
): Promise<void> {
  // Atomically claim this conversation so XP is granted only once.
  const { data: claimed } = await supabase
    .from("conversations")
    .update({ progress_awarded: true })
    .eq("id", conversationId)
    .eq("progress_awarded", false)
    .select("id, scenario")
    .maybeSingle();

  if (!claimed) return;

  await touchDailyStreak(supabase, userId);
  await addXp(supabase, userId, "conversation", XP_REWARDS.conversation);

  await evaluateBadges(supabase, userId, {
    scenario: (claimed.scenario as string | null) ?? undefined,
  });
}
