import { generatePronunciationPhrase } from "@/lib/ai/pronunciation";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 20;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { focusId, avoid } = (await req.json().catch(() => ({}))) as {
    focusId?: string;
    avoid?: string[];
  };

  const { data: lang } = await supabase
    .from("language_profile")
    .select("estimated_level")
    .eq("user_id", user.id)
    .maybeSingle();

  const level = Number(lang?.estimated_level ?? 25);
  const recent = Array.isArray(avoid)
    ? avoid.filter((sentence) => typeof sentence === "string")
    : [];

  const phrase = await generatePronunciationPhrase(level, focusId, recent);
  return Response.json(phrase);
}
