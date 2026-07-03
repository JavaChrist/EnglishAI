import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

function extensionFor(mime: string): string {
  if (mime.includes("mp4") || mime.includes("m4a")) return "mp4";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
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
  if (file.size === 0) {
    return new Response("Empty audio.", { status: 400 });
  }

  const mime = file.type || "audio/webm";
  const filename = `speech.${extensionFor(mime)}`;

  const openaiForm = new FormData();
  // Re-append with an explicit filename + extension so OpenAI can detect the
  // container format (browser MediaRecorder audio is typically webm/opus).
  openaiForm.append("file", file, filename);
  openaiForm.append("model", "whisper-1");
  openaiForm.append("language", "en");
  // Lower temperature = fewer "helpful" rewrites, closer to what was actually
  // said (useful for honest speaking assessment).
  openaiForm.append("temperature", "0");

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openaiForm,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[voice/transcribe] OpenAI error", res.status, detail);
      return new Response("Transcription failed.", { status: 502 });
    }

    const data = (await res.json()) as { text?: string };
    return Response.json({ text: (data.text ?? "").trim() });
  } catch (error) {
    console.error("[voice/transcribe] failed", error);
    return new Response("Transcription failed.", { status: 502 });
  }
}
