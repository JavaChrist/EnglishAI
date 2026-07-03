import { assessSpeaking } from "@/lib/ai/speaking";
import { XP_REWARDS } from "@/lib/constants";
import { addInputSeconds, addXp, touchDailyStreak } from "@/lib/progress/award";
import { evaluateBadges } from "@/lib/progress/badges";
import { captureVocabulary } from "@/lib/progress/vocab";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { prompt, transcript, spokenSeconds } = (await req.json()) as {
    prompt?: string;
    transcript?: string;
    spokenSeconds?: number;
  };

  const answer = String(transcript ?? "").trim();
  const question = String(prompt ?? "").trim();
  if (answer.length < 2) {
    return new Response("No answer provided.", { status: 400 });
  }

  const { data: lang } = await supabase
    .from("language_profile")
    .select("estimated_level")
    .eq("user_id", user.id)
    .maybeSingle();
  const currentLevel = Number(lang?.estimated_level ?? 25);

  const feedback = await assessSpeaking(question, answer, currentLevel);
  if (!feedback) {
    return new Response("Assessment failed.", { status: 502 });
  }

  try {
    if (feedback.level !== currentLevel) {
      await supabase
        .from("language_profile")
        .update({
          estimated_level: feedback.level,
          difficulty_updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    await captureVocabulary(supabase, user.id, feedback.vocab);
    await addXp(supabase, user.id, "speaking", XP_REWARDS.speaking);

    // Count engaged time toward the daily goal:
    //  - the learner's own speaking time (measured, or estimated at ~2 wps), and
    //  - the coach's recast + tips, which are comprehensible input (~2.5 wps).
    const answerWords = answer.split(/\s+/).filter(Boolean).length;
    const measured = Number(spokenSeconds ?? 0);
    const learnerSeconds =
      measured > 1 ? Math.min(measured, 180) : answerWords / 2;
    const feedbackWords = [feedback.encouragement, feedback.better, feedback.tip]
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;
    const inputSeconds = learnerSeconds + feedbackWords / 2.5;
    await addInputSeconds(supabase, user.id, inputSeconds, "speaking");
    await touchDailyStreak(supabase, user.id);
    const unlocked = await evaluateBadges(supabase, user.id, { spoke: true });

    return Response.json({
      encouragement: feedback.encouragement,
      better: feedback.better,
      tip: feedback.tip,
      onTopic: feedback.onTopic,
      vocab: feedback.vocab,
      unlocked,
    });
  } catch (error) {
    console.error("[speaking/evaluate] failed", error);
    return new Response("Failed to record progress.", { status: 502 });
  }
}
