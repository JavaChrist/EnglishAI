import { addInputSeconds, addXp, touchDailyStreak } from "@/lib/progress/award";
import { evaluateBadges } from "@/lib/progress/badges";
import { captureVocabulary } from "@/lib/progress/vocab";
import { XP_REWARDS } from "@/lib/constants";
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

  const { savedWords, words } = (await req.json()) as {
    savedWords?: { term: string; translation: string }[];
    words?: number;
  };

  try {
    if (Array.isArray(savedWords) && savedWords.length > 0) {
      const clean = savedWords
        .map((w) => ({
          term: String(w.term ?? "").trim(),
          translation: String(w.translation ?? "").trim(),
        }))
        .filter((w) => w.term.length > 1 && w.translation.length > 0);
      await captureVocabulary(supabase, user.id, clean);
    }

    await addXp(supabase, user.id, "reading", XP_REWARDS.reading);
    // Silent reading averages ~3 words/second.
    await addInputSeconds(supabase, user.id, Number(words ?? 0) / 3);
    await touchDailyStreak(supabase, user.id);
    await evaluateBadges(supabase, user.id);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[reading/complete] failed", error);
    return new Response("Failed to record progress.", { status: 502 });
  }
}
