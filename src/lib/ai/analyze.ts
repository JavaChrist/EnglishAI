import { openai } from "@ai-sdk/openai";
import { generateText, Output, type UIMessage } from "ai";
import { z } from "zod";

import { nextEstimatedLevel } from "@/lib/ai/adaptation";

const signalsSchema = z.object({
  comprehension: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "0-1: how well the learner understood the coach and responded appropriately.",
    ),
  fluency: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "0-1: grammatical accuracy and naturalness of the learner's English.",
    ),
  askedToSimplify: z
    .boolean()
    .describe(
      "true if the learner seemed lost, confused, or asked to slow down / repeat / simplify.",
    ),
});

/** Build a compact transcript of the most recent turns for assessment. */
export function buildTranscript(messages: UIMessage[], maxTurns = 6): string {
  return messages
    .slice(-maxTurns)
    .map((m) => {
      const text = m.parts
        .map((p) => (p.type === "text" ? p.text : ""))
        .join("")
        .trim();
      return `${m.role === "user" ? "Learner" : "Coach"}: ${text}`;
    })
    .filter((line) => line.length > 9)
    .join("\n");
}

/**
 * Assess the learner's latest performance and return the adjusted
 * continuous level (Krashen i+1). Returns null if assessment failed.
 */
export async function analyzeTurn(
  transcript: string,
  currentLevel: number,
): Promise<number | null> {
  try {
    const { output } = await generateText({
      model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
      output: Output.object({ schema: signalsSchema }),
      system:
        "You are a concise English-learning assessment engine. Assess ONLY the learner's (user) messages, not the coach's. Be calibrated and fair.",
      prompt: `Conversation transcript:\n\n${transcript}\n\nAssess the learner's latest performance.`,
    });

    return nextEstimatedLevel(currentLevel, {
      comprehension: output.comprehension,
      fluency: output.fluency,
      askedToSimplify: output.askedToSimplify,
    });
  } catch (error) {
    console.error("[analyzeTurn] adaptation failed", error);
    return null;
  }
}
