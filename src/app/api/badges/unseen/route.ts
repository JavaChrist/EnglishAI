import { createClient } from "@/lib/supabase/server";

export const maxDuration = 10;

/**
 * Return badges unlocked but not yet shown to the learner, and mark them as
 * seen so the "Badge unlocked!" toast fires exactly once.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: unseen } = await supabase
    .from("achievements")
    .select("badge_key")
    .eq("user_id", user.id)
    .eq("seen", false);

  const keys = (unseen ?? []).map((r) => r.badge_key as string);

  if (keys.length > 0) {
    await supabase
      .from("achievements")
      .update({ seen: true })
      .eq("user_id", user.id)
      .in("badge_key", keys);
  }

  return Response.json({ badges: keys });
}
