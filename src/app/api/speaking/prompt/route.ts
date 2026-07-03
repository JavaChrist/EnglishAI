import { generateSpeakingPrompt } from "@/lib/ai/speaking";
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

  const { avoid } = (await req.json().catch(() => ({}))) as {
    avoid?: string[];
  };

  const { data: lang } = await supabase
    .from("language_profile")
    .select("estimated_level, interests")
    .eq("user_id", user.id)
    .maybeSingle();

  const level = Number(lang?.estimated_level ?? 25);
  const interests = (lang?.interests as string[] | null) ?? [];
  const recent = Array.isArray(avoid)
    ? avoid.filter((p) => typeof p === "string")
    : [];

  const prompt = await generateSpeakingPrompt(level, interests, recent);
  return Response.json({ prompt });
}
