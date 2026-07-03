import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const VOICE_ENV: Record<string, string | undefined> = {
  male: process.env.ELEVENLABS_VOICE_ID_MALE,
  female: process.env.ELEVENLABS_VOICE_ID_FEMALE,
};

/** Remove emojis/pictographs so the TTS engine doesn't read them aloud. */
function stripForSpeech(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function synthesize(
  rawText: string,
  voice: "male" | "female",
): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response("Text-to-speech is not configured.", { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clean = stripForSpeech(rawText).slice(0, 800);
  if (!clean) {
    return new Response("No text to speak.", { status: 400 });
  }

  const voiceId = VOICE_ENV[voice] ?? VOICE_ENV.female ?? VOICE_ENV.male;
  if (!voiceId) {
    return new Response("No ElevenLabs voice configured.", { status: 503 });
  }

  const modelId = process.env.ELEVENLABS_MODEL ?? "eleven_turbo_v2_5";

  // /stream + optimize_streaming_latency = lower time-to-first-byte so the
  // browser can start playing almost immediately.
  const elevenRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=3&output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: clean,
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );

  if (!elevenRes.ok || !elevenRes.body) {
    const detail = await elevenRes.text().catch(() => "");
    console.error("[voice/generate] ElevenLabs error", elevenRes.status, detail);
    return new Response("Text-to-speech failed.", { status: 502 });
  }

  return new Response(elevenRes.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}

/** GET lets an <audio> element stream directly (progressive playback). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") ?? "";
  const voice = (searchParams.get("voice") as "male" | "female") ?? "female";
  return synthesize(text, voice);
}

export async function POST(req: Request) {
  const { text, voice } = (await req.json()) as {
    text?: string;
    voice?: "male" | "female";
  };
  return synthesize(text ?? "", voice ?? "female");
}
