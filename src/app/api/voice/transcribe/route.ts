import { openai } from "@ai-sdk/openai";
import { transcribe } from "ai";

import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("Transcription is not configured.", { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return new Response("No audio provided.", { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0) {
    return new Response("Empty audio.", { status: 400 });
  }

  try {
    const result = await transcribe({
      model: openai.transcription("whisper-1"),
      audio: bytes,
      providerOptions: { openai: { language: "en" } },
    });
    return Response.json({ text: result.text.trim() });
  } catch (error) {
    console.error("[voice/transcribe] failed", error);
    return new Response("Transcription failed.", { status: 502 });
  }
}
