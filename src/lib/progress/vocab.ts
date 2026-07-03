import type { VocabItem } from "@/lib/ai/analyze";
import type { createClient } from "@/lib/supabase/server";
import { SRS_INTERVALS_MINUTES } from "@/lib/constants";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Persist newly-encountered vocabulary and schedule the first spaced-repetition
 * review for each genuinely new item (existing terms are left untouched).
 */
export async function captureVocabulary(
  supabase: SupabaseServerClient,
  userId: string,
  items: VocabItem[],
): Promise<void> {
  if (items.length === 0) return;

  // Deduplicate within this batch (normalise term to lowercase).
  const seen = new Set<string>();
  const rows = items
    .map((item) => ({
      user_id: userId,
      term: item.term.toLowerCase(),
      translation: item.translation,
    }))
    .filter((row) => {
      if (seen.has(row.term)) return false;
      seen.add(row.term);
      return true;
    });

  // Insert only new terms (unique on user_id+term); returns just the inserted.
  const { data: inserted, error } = await supabase
    .from("vocabulary_items")
    .upsert(rows, { onConflict: "user_id,term", ignoreDuplicates: true })
    .select("id");

  if (error || !inserted || inserted.length === 0) return;

  const dueAt = new Date(
    Date.now() + SRS_INTERVALS_MINUTES[0] * 60_000,
  ).toISOString();

  const reviews = inserted.map((v) => ({
    user_id: userId,
    vocabulary_item_id: v.id as string,
    interval_index: 0,
    due_at: dueAt,
  }));

  await supabase.from("reviews").insert(reviews);
}
