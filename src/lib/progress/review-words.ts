import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Recently-learned, not-yet-mastered words for the learner. These are fed back
 * into new comprehensible input (conversations, clips) so the learner meets them
 * again in context — the core of Krashen-style acquisition and spaced recycling.
 */
export async function getReviewWords(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 8,
): Promise<string[]> {
  const { data } = await supabase
    .from("vocabulary_items")
    .select("term")
    .eq("user_id", userId)
    .neq("status", "mastered")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? [])
    .map((r) => (r.term as string | null)?.trim())
    .filter((t): t is string => Boolean(t));
}
