import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

import { analyzeTurn, buildTranscript } from "@/lib/ai/analyze";
import { buildConversationSystemPrompt } from "@/lib/ai/prompt";
import { awardConversationProgress } from "@/lib/progress/award";
import { captureVocabulary } from "@/lib/progress/vocab";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

function extractText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export async function POST(req: Request) {
  const {
    messages,
    scenario,
    conversationId,
  }: { messages: UIMessage[]; scenario: string; conversationId: string } =
    await req.json();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: lang } = await supabase
    .from("language_profile")
    .select("estimated_level, interests")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("users_profile")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const firstName =
    (profile?.display_name as string | null)?.trim() ||
    (user.user_metadata?.first_name as string | undefined)?.trim() ||
    "there";

  const currentLevel = Number(lang?.estimated_level ?? 25);

  const system = buildConversationSystemPrompt({
    scenarioKey: scenario,
    estimatedLevel: currentLevel,
    interests: (lang?.interests as string[] | null) ?? [],
    firstName,
  });

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
    system,
    messages: await convertToModelMessages(messages),
  });

  // Ensure the stream completes (and onEnd persists) even if the client aborts.
  result.consumeStream();

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      onEnd: async ({ messages: finalMessages }) => {
        const rows = finalMessages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            id: m.id,
            conversation_id: conversationId,
            role: m.role,
            content: extractText(m),
          }))
          .filter((row) => row.content.length > 0);

        if (rows.length > 0) {
          await supabase
            .from("conversation_messages")
            .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
        }

        // Krashen i+1 — continuous adaptation after each exchange.
        // Runs server-side after the stream is delivered, so it never
        // delays what the learner sees.
        const hasLearnerTurn = finalMessages.some((m) => m.role === "user");
        if (hasLearnerTurn) {
          const transcript = buildTranscript(finalMessages);
          const analysis = await analyzeTurn(transcript, currentLevel);
          if (analysis) {
            if (analysis.level !== currentLevel) {
              await supabase
                .from("language_profile")
                .update({
                  estimated_level: analysis.level,
                  difficulty_updated_at: new Date().toISOString(),
                })
                .eq("user_id", user.id);
            }

            // Capture i+1 vocabulary and schedule spaced-repetition reviews.
            try {
              await captureVocabulary(supabase, user.id, analysis.vocab);
            } catch (error) {
              console.error("[chat] vocab capture failed", error);
            }
          }

          // Progression & gamification (XP, streak, badge) — granted once
          // per conversation via an atomic claim.
          try {
            await awardConversationProgress(supabase, user.id, conversationId);
          } catch (error) {
            console.error("[chat] progression failed", error);
          }
        }
      },
    }),
  });
}
