import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("onboarded, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarded) {
    redirect("/dashboard");
  }

  const firstName =
    (profile?.display_name as string | null)?.trim() ||
    (user.user_metadata?.first_name as string | undefined)?.trim() ||
    "there";

  return <OnboardingWizard firstName={firstName} />;
}
