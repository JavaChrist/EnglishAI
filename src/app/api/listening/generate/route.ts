import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import { difficultyBrief } from "@/lib/ai/adaptation";
import { getReviewWords } from "@/lib/progress/review-words";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 45;

const clipSchema = z.object({
  title: z.string().describe("Short, catchy English title for the clip."),
  lines: z
    .array(
      z.object({
        speaker: z.enum(["A", "B"]).describe("Which speaker says this line."),
        text: z.string().describe("One natural spoken line (no name prefix)."),
      }),
    )
    .min(2)
    .describe("A natural two-person dialogue."),
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        answerIndex: z.number().int().min(0).max(3),
      }),
    )
    .min(2)
    .max(3)
    .describe("Comprehension questions with 4 options each."),
  summary: z.string().describe("One-sentence English summary of the clip."),
  keywords: z
    .array(z.object({ term: z.string(), translation: z.string() }))
    .min(2)
    .max(6)
    .describe("Key vocabulary from the clip with concise French translations."),
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("Listening is not configured.", { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { duration, topic } = (await req.json()) as {
    duration?: number;
    topic?: string;
  };
  const seconds = [30, 60, 120].includes(Number(duration))
    ? Number(duration)
    : 60;
  const targetWords = Math.round(seconds * 2.3);

  const { data: lang } = await supabase
    .from("language_profile")
    .select("estimated_level, interests")
    .eq("user_id", user.id)
    .maybeSingle();

  const level = Number(lang?.estimated_level ?? 25);
  const interests = ((lang?.interests as string[] | null) ?? []).join(", ");
  const reviewWords = await getReviewWords(supabase, user.id);

  // Narrow input: when the learner asks for "more on the same topic", keep the
  // subject fixed so vocabulary repeats in fresh contexts (Krashen).
  const topicLine =
    topic && topic.trim()
      ? `Stay on this specific topic (a fresh angle, not a repeat): "${topic.trim()}".`
      : interests
        ? `Favor a topic the learner enjoys: ${interests}.`
        : "";
  const recycleLine =
    reviewWords.length > 0
      ? `Naturally reuse a few of these words the learner is reviewing when they fit: ${reviewWords.join(", ")}.`
      : "";

  try {
    const { output } = await generateText({
      model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
      output: Output.object({ schema: clipSchema }),
      system: `You are a scriptwriter for English listening practice.
Write a short, natural two-person dialogue (speakers A and B) in English.
Difficulty target (Krashen i+1): ${difficultyBrief(level)}
Keep it engaging and realistic. Aim for about ${targetWords} words total so it lasts ~${seconds}s when spoken.
${topicLine}
${recycleLine}
Then write ${seconds <= 30 ? 2 : 3} comprehension questions (4 options, one correct), a one-sentence summary, and key vocabulary with French translations.`,
      prompt: "Generate the listening clip now.",
    });

    return Response.json(output);
  } catch (error) {
    console.error("[listening/generate] failed", error);
    return new Response("Failed to generate the clip.", { status: 502 });
  }
}
