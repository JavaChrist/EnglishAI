import { addXp, touchDailyStreak } from "@/lib/progress/award";
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

  const { keywords } = (await req.json()) as {
    keywords?: { term: string; translation: string }[];
  };

  try {
    if (Array.isArray(keywords) && keywords.length > 0) {
      const clean = keywords
        .map((k) => ({
          term: String(k.term ?? "").trim(),
          translation: String(k.translation ?? "").trim(),
        }))
        .filter((k) => k.term.length > 1 && k.translation.length > 0);
      await captureVocabulary(supabase, user.id, clean);
    }

    await addXp(supabase, user.id, "listening", XP_REWARDS.listening);
    await touchDailyStreak(supabase, user.id);
    await evaluateBadges(supabase, user.id, { listened: true });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[listening/complete] failed", error);
    return new Response("Failed to record progress.", { status: 502 });
  }
}
