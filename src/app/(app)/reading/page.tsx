import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { ReadingRoom } from "@/components/reading/reading-room";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reading Room",
};

export default async function ReadingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: lang } = await supabase
    .from("language_profile")
    .select("voice")
    .eq("user_id", user.id)
    .maybeSingle();

  const voice = (lang?.voice as "male" | "female" | null) ?? "female";

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <ReadingRoom voice={voice} />
    </div>
  );
}
