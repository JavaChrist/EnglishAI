import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { PronunciationRoom } from "@/components/pronunciation/pronunciation-room";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pronunciation",
};

export default async function PronunciationPage() {
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
      <PronunciationRoom voice={voice} />
    </div>
  );
}
