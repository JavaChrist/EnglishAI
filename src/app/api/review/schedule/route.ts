import { addXp, touchDailyStreak } from "@/lib/progress/award";
import { evaluateBadges } from "@/lib/progress/badges";
import { SRS_INTERVALS_MINUTES, XP_REWARDS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 15;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { reviewId, correct } = (await req.json()) as {
    reviewId?: string;
    correct?: boolean;
  };
  if (!reviewId) {
    return new Response("Missing reviewId.", { status: 400 });
  }

  const { data: review } = await supabase
    .from("reviews")
    .select("id, interval_index, vocabulary_item_id")
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!review) {
    return new Response("Review not found.", { status: 404 });
  }

  const lastIndex = SRS_INTERVALS_MINUTES.length - 1;
  const currentIndex = Number(review.interval_index ?? 0);
  const nextIndex = correct ? Math.min(currentIndex + 1, lastIndex) : 0;
  const dueAt = new Date(
    Date.now() + SRS_INTERVALS_MINUTES[nextIndex] * 60_000,
  ).toISOString();

  await supabase
    .from("reviews")
    .update({ interval_index: nextIndex, due_at: dueAt })
    .eq("id", reviewId)
    .eq("user_id", user.id);

  const status = nextIndex >= 4 ? "mastered" : correct ? "active" : "passive";
  await supabase
    .from("vocabulary_items")
    .update({ status })
    .eq("id", review.vocabulary_item_id as string)
    .eq("user_id", user.id);

  if (correct) {
    try {
      await addXp(supabase, user.id, "review", XP_REWARDS.review);
      await touchDailyStreak(supabase, user.id);
      await evaluateBadges(supabase, user.id);
    } catch (error) {
      console.error("[review/schedule] progression failed", error);
    }
  }

  return Response.json({ ok: true, nextIndex, dueAt });
}
