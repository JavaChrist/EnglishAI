import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Context describing what the learner just did, used to unlock badges. */
export type BadgeContext = {
  /** Scenario key of a just-completed conversation. */
  scenario?: string;
  /** True when a listening session was just completed. */
  listened?: boolean;
};

/**
 * Evaluate all badge conditions and unlock any newly-earned ones (idempotent).
 * Returns the list of badge keys that were unlocked by THIS call (empty if none
 * were new), so callers can surface a "badge unlocked" notification if wanted.
 */
export async function evaluateBadges(
  supabase: SupabaseServerClient,
  userId: string,
  ctx: BadgeContext = {},
): Promise<string[]> {
  const grant = new Set<string>();

  // Activity-driven badges.
  if (ctx.scenario) {
    grant.add("first_conversation");
    if (ctx.scenario === "travel") grant.add("travel_ready");
    if (ctx.scenario === "motorcycles") grant.add("motorcycle_talker");
    if (ctx.scenario === "business") grant.add("business_starter");
  }
  if (ctx.listened) grant.add("native_listener");

  // Streak milestone.
  const { data: profile } = await supabase
    .from("users_profile")
    .select("streak_current")
    .eq("id", userId)
    .maybeSingle();
  if (Number(profile?.streak_current ?? 0) >= 7) grant.add("7_day_streak");

  // Vocabulary milestone (words encountered / heard).
  const { count: wordCount } = await supabase
    .from("vocabulary_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (Number(wordCount ?? 0) >= 100) grant.add("100_words_heard");

  if (grant.size === 0) return [];

  const rows = [...grant].map((badge_key) => ({
    user_id: userId,
    badge_key,
    seen: false,
  }));
  const { data: inserted } = await supabase
    .from("achievements")
    .upsert(rows, { onConflict: "user_id,badge_key", ignoreDuplicates: true })
    .select("badge_key");

  return (inserted ?? []).map((r) => r.badge_key as string);
}
