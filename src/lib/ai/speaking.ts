import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import { difficultyBrief, nextEstimatedLevel } from "@/lib/ai/adaptation";
import type { VocabItem } from "@/lib/ai/analyze";

const model = () => openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini");

/** Different angles so prompts don't all sound the same or stay on one topic. */
const PROMPT_ANGLES = [
  "a specific memory from your past (use past tense)",
  "your plans, hopes or dreams for the future (use future tense)",
  "your honest opinion about a simple everyday topic",
  "describing a person who matters to you",
  "comparing two things you know and which you prefer",
  "a small daily routine or habit of yours",
  "a hypothetical: 'what would you do if…'",
  "telling a very short story about something that happened to you",
  "describing a place (your home, street, town or a room)",
  "a problem you solved or some advice you would give someone",
  "something that made you happy, surprised or annoyed recently",
  "explaining how to do something simple, step by step",
] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a short, warm speaking prompt at the learner's i+1 level. To keep
 * variety, it rotates through different angles/tenses, uses a randomly chosen
 * interest, and avoids recently-used prompts.
 */
export async function generateSpeakingPrompt(
  currentLevel: number,
  interests: string[],
  avoid: string[] = [],
): Promise<string> {
  const brief = difficultyBrief(currentLevel);
  const angle = pick(PROMPT_ANGLES);
  // Sometimes tie it to an interest, sometimes keep it about everyday life so
  // it doesn't always circle back to the same favourite topic.
  const useInterest = interests.length > 0 && Math.random() < 0.6;
  const topic = useInterest ? pick(interests) : "everyday life";
  const avoidList = avoid
    .slice(-4)
    .map((p) => `- ${p}`)
    .join("\n");

  try {
    const { text } = await generateText({
      model: model(),
      temperature: 1,
      system:
        "You are a friendly English speaking coach using Krashen's comprehensible input. Produce ONE short, open speaking prompt (a single question) the learner can answer out loud in a few sentences. Keep the wording at or just below their level so it's fully understandable. Warm, concrete and specific — never abstract. Vary your topics and question types a lot from one prompt to the next. Output ONLY the question, no preamble, no quotes.",
      prompt: `Learner level: ${brief}
Angle to use this time: ${angle}
Loose theme (optional inspiration only): ${topic}
${avoidList ? `Do NOT repeat or paraphrase these recent prompts:\n${avoidList}\n` : ""}Write one fresh speaking prompt that fits the angle above.`,
    });
    return text.trim().replace(/^["']|["']$/g, "");
  } catch (error) {
    console.error("[generateSpeakingPrompt] failed", error);
    return "Tell me about your day. What did you do this morning?";
  }
}

const feedbackSchema = z.object({
  proficiency: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Absolute CEFR estimate (0-100) of the learner's spoken English, judged ONLY from their transcribed answer. Rubric: A1≈10, A2≈25, B1≈45, B2≈60, C1≈78, C2≈92. Be strict and conservative; most learners are A2-B1.",
    ),
  fluency: z
    .number()
    .min(0)
    .max(1)
    .describe("0-1: grammatical accuracy and naturalness of the answer."),
  onTopic: z
    .boolean()
    .describe("true if the answer actually addressed the prompt."),
  encouragement: z
    .string()
    .describe(
      "One short, warm, specific compliment about what the learner did well (max ~15 words).",
    ),
  better: z
    .string()
    .describe(
      "A natural, slightly-improved i+1 rewrite of what the learner ACTUALLY said (1-2 sentences). Preserve THEIR meaning and their facts exactly — do NOT invent new details, opinions or reasons they didn't express. If part of their answer is unclear, keep it simple and general rather than making something up. Only fix grammar and word choice.",
    ),
  tip: z
    .string()
    .describe(
      "One concrete, friendly tip in simple English to improve next time (max ~20 words). Never say 'wrong'.",
    ),
  newVocabulary: z
    .array(
      z.object({
        term: z.string().describe("English word or short phrase."),
        translation: z.string().describe("Concise French translation."),
      }),
    )
    .max(3)
    .describe(
      "0-3 useful words/phrases slightly above the learner's level to help them express this idea better next time.",
    ),
});

export type SpeakingFeedback = {
  level: number;
  encouragement: string;
  better: string;
  tip: string;
  onTopic: boolean;
  vocab: VocabItem[];
};

/**
 * Assess a spoken answer: estimate proficiency, adapt the i+1 level, and return
 * gentle feedback plus a recast and i+1 vocabulary. Returns null on failure.
 */
export async function assessSpeaking(
  prompt: string,
  transcript: string,
  currentLevel: number,
): Promise<SpeakingFeedback | null> {
  try {
    const { output } = await generateText({
      model: model(),
      output: Output.object({ schema: feedbackSchema }),
      system:
        "You are a warm, encouraging English speaking coach. The learner answered a prompt out loud and their speech was transcribed (so ignore punctuation/casing artifacts). Assess ONLY their spoken English, give kind feedback with a natural recast, and estimate their true level conservatively.",
      prompt: `Prompt: ${prompt}\n\nLearner's spoken answer (transcribed): ${transcript}\n\nGive feedback and estimate proficiency.`,
    });

    const level = nextEstimatedLevel(currentLevel, {
      proficiency: output.proficiency,
      comprehension: output.onTopic ? 0.85 : 0.5,
      fluency: output.fluency,
    });

    const vocab = (output.newVocabulary ?? [])
      .map((v) => ({ term: v.term.trim(), translation: v.translation.trim() }))
      .filter((v) => v.term.length > 1 && v.translation.length > 0);

    return {
      level,
      encouragement: output.encouragement.trim(),
      better: output.better.trim(),
      tip: output.tip.trim(),
      onTopic: output.onTopic,
      vocab,
    };
  } catch (error) {
    console.error("[assessSpeaking] failed", error);
    return null;
  }
}
