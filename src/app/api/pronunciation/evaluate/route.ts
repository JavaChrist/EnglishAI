import { explainsInFrench } from "@/lib/ai/adaptation";
import {
  assessPronunciation,
  getFocus,
  type Phrase,
} from "@/lib/ai/pronunciation";
import { XP_REWARDS } from "@/lib/constants";
import { addInputSeconds, addXp, touchDailyStreak } from "@/lib/progress/award";
import { evaluateBadges } from "@/lib/progress/badges";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const sentence = String(form.get("sentence") ?? "").trim();
  const focusId = String(form.get("focusId") ?? "");
  const spokenSeconds = Number(form.get("spokenSeconds") ?? 0);

  if (!(file instanceof Blob) || file.size === 0) {
    return new Response("No audio provided.", { status: 400 });
  }
  if (file.size > 4_000_000) {
    return new Response("Recording is too long.", { status: 400 });
  }
  if (sentence.length < 4 || sentence.length > 240) {
    return new Response("No sentence to repeat.", { status: 400 });
  }

  const focus = getFocus(focusId);

  const { data: lang } = await supabase
    .from("language_profile")
    .select("estimated_level")
    .eq("user_id", user.id)
    .maybeSingle();
  const french = explainsInFrench(Number(lang?.estimated_level ?? 25));

  const phrase: Phrase = {
    sentence,
    translation: "",
    focusId: focus.id,
    focus: french ? focus.coachFr : focus.coach,
    guide: french ? focus.guideFr : focus.guide,
    explainInFrench: french,
  };

  const audio = new Uint8Array(await file.arrayBuffer());
  const feedback = await assessPronunciation(
    audio,
    file.type || "audio/wav",
    phrase,
  );
  if (!feedback) {
    return new Response("Couldn't assess the recording.", { status: 502 });
  }

  try {
    await addXp(supabase, user.id, "pronunciation", XP_REWARDS.pronunciation);

    const measured = Number.isFinite(spokenSeconds) ? spokenSeconds : 0;
    const learnerSeconds = measured > 1 ? Math.min(measured, 30) : 4;
    const modelSeconds =
      sentence.split(/\s+/).filter(Boolean).length / 2.5;
    await addInputSeconds(
      supabase,
      user.id,
      learnerSeconds + modelSeconds,
      "pronunciation",
    );
    await touchDailyStreak(supabase, user.id);
    const unlocked = await evaluateBadges(supabase, user.id);

    return Response.json({ ...feedback, unlocked });
  } catch (error) {
    console.error("[pronunciation/evaluate] failed", error);
    return new Response("Failed to record progress.", { status: 502 });
  }
}
