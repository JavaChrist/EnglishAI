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

export async function POST(req: Request) {
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

  const { text, voice } = (await req.json()) as {
    text?: string;
    voice?: "male" | "female";
  };

  const clean = stripForSpeech(text ?? "").slice(0, 800);
  if (!clean) {
    return new Response("No text to speak.", { status: 400 });
  }

  const voiceId =
    VOICE_ENV[voice ?? "female"] ?? VOICE_ENV.female ?? VOICE_ENV.male;
  if (!voiceId) {
    return new Response("No ElevenLabs voice configured.", { status: 503 });
  }

  const elevenRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: clean,
        model_id: "eleven_multilingual_v2",
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
