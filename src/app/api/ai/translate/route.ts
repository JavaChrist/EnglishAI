import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("Translation is not configured.", { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { text } = (await req.json()) as { text?: string };
  const clean = (text ?? "").trim().slice(0, 1000);
  if (!clean) {
    return new Response("No text to translate.", { status: 400 });
  }

  try {
    const { text: french } = await generateText({
      model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
      system:
        "You are a translator. Translate the user's English text into natural, conversational French. Return ONLY the French translation — no notes, no quotes, no explanations.",
      prompt: clean,
    });
    return Response.json({ text: french.trim() });
  } catch (error) {
    console.error("[ai/translate] failed", error);
    return new Response("Translation failed.", { status: 502 });
  }
}
