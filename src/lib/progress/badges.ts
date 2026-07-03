import { BADGES, type BadgeMetric } from "@/lib/constants";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Context describing what the learner just did, used to unlock badges. */
export type BadgeContext = {
  /** Scenario key of a just-completed conversation. */
  scenario?: string;
  /** True when a listening session was just completed. */
  listened?: boolean;
  /** True when a speaking answer was just submitted. */
  spoke?: boolean;
};

/**
 * Evaluate all badge conditions and unlock any newly-earned ones (idempotent).
 *
 * Metrics are derived from durable data (xp events per activity, vocabulary,
 * streak, input time, level) so tiered badges keep unlocking as the learner
 * progresses. Returns the badge keys unlocked by THIS call.
 */
export async function evaluateBadges(
  supabase: SupabaseServerClient,
  userId: string,
  ctx: BadgeContext = {},
): Promise<string[]> {
  const [xpRes, vocabRes, profileRes, langRes, scenarioRes] = await Promise.all([
    supabase.from("xp_events").select("source").eq("user_id", userId),
    supabase.from("vocabulary_items").select("status").eq("user_id", userId),
    supabase
      .from("users_profile")
      .select("streak_longest, streak_current, input_seconds")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("language_profile")
      .select("estimated_level")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("conversations")
      .select("scenario")
      .eq("user_id", userId)
      .eq("progress_awarded", true),
  ]);

  const sourceCounts: Record<string, number> = {};
  (xpRes.data ?? []).forEach((e) => {
    const s = e.source as string;
    sourceCounts[s] = (sourceCounts[s] ?? 0) + 1;
  });

  const vocab = vocabRes.data ?? [];
  const streakLongest = Math.max(
    Number(profileRes.data?.streak_longest ?? 0),
    Number(profileRes.data?.streak_current ?? 0),
  );
  const inputMinutes = Math.floor(
    Number(profileRes.data?.input_seconds ?? 0) / 60,
  );
  const level = Number(langRes.data?.estimated_level ?? 0);

  const completedScenarios = new Set<string>(
    (scenarioRes.data ?? []).map((c) => c.scenario as string),
  );
  if (ctx.scenario) completedScenarios.add(ctx.scenario);

  const metrics: Record<Exclude<BadgeMetric, "scenario">, number> = {
    conversations: sourceCounts.conversation ?? 0,
    listening: sourceCounts.listening ?? 0,
    reading: sourceCounts.reading ?? 0,
    speaking: sourceCounts.speaking ?? 0,
    reviews: sourceCounts.review ?? 0,
    streak: streakLongest,
    words: vocab.length,
    mastered: vocab.filter((v) => v.status === "mastered").length,
    inputMinutes,
    level,
  };

  const grant = new Set<string>();
  for (const badge of BADGES) {
    if (badge.metric === "scenario") {
      if (badge.scenario && completedScenarios.has(badge.scenario)) {
        grant.add(badge.key);
      }
      continue;
    }
    if (metrics[badge.metric] >= badge.threshold) {
      grant.add(badge.key);
    }
  }

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
