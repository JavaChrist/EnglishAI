import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { ConversationChat } from "@/components/conversation/conversation-chat";
import { scenarioLabel, scenarioOpener } from "@/lib/ai/prompt";
import { SCENARIOS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ scenario: string }>;
}): Promise<Metadata> {
  const { scenario } = await params;
  return { title: scenarioLabel(scenario) };
}

export default async function ConversationSessionPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  const { scenario } = await params;

  if (!SCENARIOS.some((s) => s.key === scenario)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: lang } = await supabase
    .from("language_profile")
    .select("voice, accent")
    .eq("user_id", user.id)
    .maybeSingle();

  const firstName =
    (profile?.display_name as string | null)?.trim() ||
    (user.user_metadata?.first_name as string | undefined)?.trim() ||
    "there";

  const voice = (lang?.voice as "male" | "female" | null) ?? "female";
  const accent = (lang?.accent as "us" | "uk" | null) ?? "us";

  const { data: conversation } = await supabase
    .from("conversations")
    .insert({ user_id: user.id, scenario })
    .select("id")
    .single();

  if (!conversation) {
    redirect("/conversation");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <ConversationChat
        conversationId={conversation.id as string}
        scenario={scenario}
        label={scenarioLabel(scenario)}
        opener={scenarioOpener(scenario, firstName)}
        voice={voice}
        accent={accent}
      />
    </div>
  );
}
