import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import { difficultyBrief } from "@/lib/ai/adaptation";
import { READING_LENGTHS } from "@/lib/constants";
import { getReviewWords } from "@/lib/progress/review-words";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 45;

const storySchema = z.object({
  title: z.string().describe("Short, engaging English title."),
  paragraphs: z
    .array(z.string())
    .min(1)
    .describe("The story as an ordered list of short paragraphs."),
  glossary: z
    .array(z.object({ term: z.string(), translation: z.string() }))
    .min(3)
    .max(12)
    .describe(
      "The trickier words/phrases from the story that are slightly above the learner's level (i+1), with concise French translations.",
    ),
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
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("Reading is not configured.", { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { length } = (await req.json()) as { length?: string };
  const preset =
    READING_LENGTHS.find((l) => l.key === length) ?? READING_LENGTHS[1];

  const { data: lang } = await supabase
    .from("language_profile")
    .select("estimated_level, interests")
    .eq("user_id", user.id)
    .maybeSingle();

  const level = Number(lang?.estimated_level ?? 25);
  const interests = ((lang?.interests as string[] | null) ?? []).join(", ");
  const reviewWords = await getReviewWords(supabase, user.id);

  try {
    const { output } = await generateText({
      model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
      output: Output.object({ schema: storySchema }),
      system: `You are a graded-reader author for English learners.
Write an engaging, self-contained short story or article in natural English.
Difficulty target (Krashen i+1): ${difficultyBrief(level)}
Aim for about ${preset.words} words, split into short paragraphs.
${interests ? `Favor a topic the learner enjoys: ${interests}.` : ""}
${reviewWords.length > 0 ? `Naturally reuse a few of these words the learner is reviewing when they fit: ${reviewWords.join(", ")}.` : ""}
Provide a glossary of the trickier words (i+1) with concise French translations, and ${preset.words <= 120 ? 2 : 3} comprehension questions.`,
      prompt: "Write the reading passage now.",
    });

    return Response.json(output);
  } catch (error) {
    console.error("[reading/generate] failed", error);
    return new Response("Failed to generate the passage.", { status: 502 });
  }
}
