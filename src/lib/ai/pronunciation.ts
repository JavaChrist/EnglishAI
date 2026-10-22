import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import { difficultyBrief } from "@/lib/ai/adaptation";
import {
  getFocus,
  type PronunciationFocus,
} from "@/lib/pronunciation/focuses";

const textModel = () => openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini");

export type { PronunciationFocus };
export { getFocus };

export type Phrase = {
  sentence: string;
  focusId: string;
  focus: string;
  guide: string;
};

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function cleanSentence(text: string): string {
  return text
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ");
}

/**
 * A short sentence the learner can hear and repeat. Wording stays at or just
 * below their level; the challenge is the sound, not new grammar.
 */
export async function generatePronunciationPhrase(
  currentLevel: number,
  focusId: string | null | undefined,
  avoid: string[] = [],
): Promise<Phrase> {
  const focus = getFocus(focusId);
  const brief = difficultyBrief(currentLevel);
  const avoidList = avoid
    .slice(-4)
    .map((sentence) => `- ${sentence}`)
    .join("\n");

  let sentence = "";
  try {
    const { text } = await generateText({
      model: textModel(),
      temperature: 0.9,
      system:
        "You write ONE short English sentence for a pronunciation drill. The learner will hear it and repeat it. 5 to 12 words. Everyday and concrete. Fully understandable at their level. Output ONLY the sentence, no quotes, no focus label, no explanation.",
      prompt: `Learner level: ${brief}
Sound to practise: ${focus.coach}
${focus.instruction}
${avoidList ? `Do NOT repeat these sentences:\n${avoidList}\n` : ""}Write one sentence.`,
    });
    sentence = cleanSentence(text);
  } catch (error) {
    console.error("[generatePronunciationPhrase] failed", error);
  }

  const wordCount = sentence.split(/\s+/).filter(Boolean).length;
  if (!sentence || wordCount < 4 || wordCount > 16 || !focus.pattern.test(sentence)) {
    const unused =
      focus.fallbacks.find((line) => !avoid.includes(line)) ?? pick(focus.fallbacks);
    sentence = unused;
  }

  return {
    sentence,
    focusId: focus.id,
    focus: focus.coach,
    guide: focus.guide,
  };
}

export type WordFeedback = {
  word: string;
  status: "clear" | "check";
  note?: string;
};

export type PronunciationFeedback = {
  score: number;
  heard: string;
  encouragement: string;
  tip: string;
  words: WordFeedback[];
};

const feedbackSchema = z.object({
  score: z.number().min(0).max(100),
  heard: z.string(),
  encouragement: z.string(),
  tip: z.string(),
  words: z
    .array(
      z.object({
        word: z.string(),
        status: z.enum(["clear", "check"]),
        note: z.string().optional(),
      }),
    )
    .max(20),
});

const AUDIO_MODELS = ["gpt-audio-mini", "gpt-4o-mini-audio-preview"] as const;

function targetWords(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, ""))
    .filter((word) => word.length > 0);
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, "");
}

function soften(text: string): string {
  return text
    .replace(/\bwrong\b/gi, "tricky")
    .replace(/\bincorrect\b/gi, "unclear")
    .replace(/\bmistake\b/gi, "spot to polish")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Line the model's word list up with the exact target sentence. */
function mergeWords(
  sentence: string,
  reported: { word: string; status: "clear" | "check"; note?: string }[],
  score: number,
): WordFeedback[] {
  const queue = reported.map((item) => ({ ...item }));
  return targetWords(sentence).map((word) => {
    const key = normalizeWord(word);
    const index = queue.findIndex((item) => normalizeWord(item.word) === key);
    if (index < 0) {
      return {
        word,
        status: score >= 80 ? "clear" : "check",
        note: score >= 80 ? undefined : "Listen once more and match this word.",
      };
    }
    const hit = queue.splice(index, 1)[0];
    if (!hit || hit.status !== "check") return { word, status: "clear" };
    const note = soften(hit.note ?? "");
    return {
      word,
      status: "check",
      note: note || "Listen once more and match this sound.",
    };
  });
}

function shapeFeedback(
  sentence: string,
  raw: z.infer<typeof feedbackSchema>,
): PronunciationFeedback {
  const score = clampScore(raw.score);
  const words = mergeWords(sentence, raw.words, score);
  const checks = words.filter((word) => word.status === "check").length;
  const adjusted =
    words.length > 0 && checks === 0 ? Math.max(score, 85) : score;

  return {
    score: adjusted,
    heard: soften(raw.heard) || sentence,
    encouragement:
      soften(raw.encouragement) ||
      (adjusted >= 80 ? "That sounded clear." : "Good try — let's shape one sound."),
    tip:
      soften(raw.tip) ||
      "Listen to the model slowly, then copy the rhythm.",
    words,
  };
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function messageText(payload: {
  choices?: { message?: { content?: unknown } }[];
}): string {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .join("");
  }
  return "";
}

const COACH_RULES = `You are a warm English pronunciation coach. Listen to the learner repeating a model sentence. Judge the SOUNDS, not grammar and not ideas.
Never say "wrong", "incorrect", "mistake", or "bad". Be specific and kind.
Return JSON only:
{
  "score": number from 0 to 100 (how close the sounds were),
  "heard": "what you actually heard, in a short phrase",
  "encouragement": "one warm specific compliment, max 14 words",
  "tip": "one concrete tip about the mouth, breath, or stress, max 24 words",
  "words": [{ "word": "each target word in order", "status": "clear" or "check", "note": "only when status is check, max 10 words about that sound" }]
}
Mark "check" only when that word was missing, unclear, or a different sound. If the sentence was clear, score 85-100. If you hear almost no speech, score under 25 and say so kindly in the tip.`;

async function assessWithAudio(
  audio: Uint8Array,
  mime: string,
  phrase: Phrase,
): Promise<PronunciationFeedback | null> {
  if (!mime.includes("wav") && !mime.includes("mpeg") && !mime.includes("mp3")) {
    return null;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const format = mime.includes("wav") ? "wav" : "mp3";
  const models = process.env.OPENAI_AUDIO_MODEL
    ? [process.env.OPENAI_AUDIO_MODEL]
    : [...AUDIO_MODELS];

  const userText = `Target sentence: ${phrase.sentence}
Focus sound: ${phrase.focus}
How that sound is made: ${phrase.guide}
Listen and score the pronunciation. List every target word in order.`;

  for (const model of models) {
    const body = {
      model,
      temperature: 0.2,
      modalities: ["text"],
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: COACH_RULES },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            {
              type: "input_audio",
              input_audio: {
                data: Buffer.from(audio).toString("base64"),
                format,
              },
            },
          ],
        },
      ],
    };

    try {
      let res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.status === 404 || res.status === 400) {
        const detail = await res.text().catch(() => "");
        const missing = /model|not found|does not exist/i.test(detail);
        if (res.status === 404 || missing) {
          console.error("[pronunciation] audio model unavailable", model, detail);
          continue;
        }
        const withoutFormat = { ...body, response_format: undefined };
        res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(withoutFormat),
        });
      }

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("[pronunciation] audio assess failed", model, res.status, detail);
        if (/model|not found|does not exist/i.test(detail)) continue;
        return null;
      }

      const payload = (await res.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const parsed = feedbackSchema.safeParse(extractJson(messageText(payload)));
      if (!parsed.success) {
        console.error("[pronunciation] audio JSON rejected", parsed.error.message);
        return null;
      }
      return shapeFeedback(phrase.sentence, parsed.data);
    } catch (error) {
      console.error("[pronunciation] audio assess threw", model, error);
    }
  }

  return null;
}

/** Word-level match between the target and a plain transcript. */
function alignWords(sentence: string, heard: string): WordFeedback[] {
  const target = targetWords(sentence);
  const spoken = targetWords(heard);
  const n = target.length;
  const m = spoken.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array<number>(m + 1).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = normalizeWord(target[i - 1] ?? "") === normalizeWord(spoken[j - 1] ?? "");
      dp[i]![j] = same
        ? (dp[i - 1]?.[j - 1] ?? 0) + 1
        : Math.max(dp[i - 1]?.[j] ?? 0, dp[i]?.[j - 1] ?? 0);
    }
  }

  const status: Array<"clear" | "check"> = Array(n).fill("check");
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const same =
      normalizeWord(target[i - 1] ?? "") === normalizeWord(spoken[j - 1] ?? "");
    if (same) {
      status[i - 1] = "clear";
      i -= 1;
      j -= 1;
    } else if ((dp[i - 1]?.[j] ?? 0) >= (dp[i]?.[j - 1] ?? 0)) {
      i -= 1;
    } else {
      j -= 1;
    }
  }

  return target.map((word, index) =>
    status[index] === "clear"
      ? { word, status: "clear" }
      : {
          word,
          status: "check",
          note: "This word didn't come through. Listen and copy it.",
        },
  );
}

async function transcribe(
  audio: Uint8Array,
  mime: string,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const extension = mime.includes("wav")
    ? "wav"
    : mime.includes("mpeg") || mime.includes("mp3")
      ? "mp3"
      : mime.includes("mp4")
        ? "mp4"
        : "webm";

  const form = new FormData();
  const fileBytes = new Uint8Array(audio.byteLength);
  fileBytes.set(audio);
  form.append(
    "file",
    new File([fileBytes], `speech.${extension}`, {
      type: mime || "audio/webm",
    }),
  );
  form.append("model", "whisper-1");
  form.append("language", "en");
  form.append("temperature", "0");

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[pronunciation] transcribe failed", res.status, detail);
      return null;
    }
    const data = (await res.json()) as { text?: string };
    return (data.text ?? "").trim();
  } catch (error) {
    console.error("[pronunciation] transcribe threw", error);
    return null;
  }
}

const noteSchema = z.object({
  encouragement: z.string(),
  tip: z.string(),
  notes: z
    .array(z.object({ word: z.string(), note: z.string() }))
    .max(12),
});

async function polishFromTranscript(
  phrase: Phrase,
  heard: string,
  words: WordFeedback[],
): Promise<PronunciationFeedback> {
  const checks = words.filter((word) => word.status === "check");
  const score =
    words.length === 0
      ? 0
      : clampScore((100 * (words.length - checks.length)) / words.length);

  const base: PronunciationFeedback = {
    score: checks.length === 0 ? Math.max(score, 88) : score,
    heard: heard || "I couldn't catch the words.",
    encouragement:
      checks.length === 0
        ? "Clear from start to finish."
        : "Good try — a few sounds need another pass.",
    tip:
      checks.length === 0
        ? phrase.guide
        : "Play it slowly, then copy the highlighted words.",
    words,
  };

  if (!heard) {
    return {
      ...base,
      score: 0,
      encouragement: "I didn't catch that.",
      tip: "Move a little closer to the mic and try the sentence again.",
    };
  }

  try {
    const { output } = await generateText({
      model: textModel(),
      output: Output.object({ schema: noteSchema }),
      system:
        "You are a warm English pronunciation coach. You only see a transcript of a repeat-after-me attempt, so judge word sounds from what was heard versus the target. Never say wrong, incorrect, or mistake. Notes are short and about the mouth or the missing sound.",
      prompt: `Target: ${phrase.sentence}
Focus: ${phrase.focus}
Guide: ${phrase.guide}
Heard: ${heard}
Words to polish: ${checks.map((word) => word.word).join(", ") || "(none)"}
Write one encouragement, one tip, and a note only for each word to polish.`,
    });

    const notes = new Map(
      output.notes.map((item) => [normalizeWord(item.word), soften(item.note)]),
    );

    return {
      ...base,
      encouragement: soften(output.encouragement) || base.encouragement,
      tip: soften(output.tip) || base.tip,
      words: words.map((word) =>
        word.status === "check"
          ? {
              ...word,
              note: notes.get(normalizeWord(word.word)) || word.note,
            }
          : word,
      ),
    };
  } catch (error) {
    console.error("[pronunciation] text polish failed", error);
    return base;
  }
}

/**
 * Listen to the recording and compare it with the model sentence.
 * Prefers an audio model (it hears the sounds). If that isn't available,
 * falls back to a transcript comparison.
 */
export async function assessPronunciation(
  audio: Uint8Array,
  mime: string,
  phrase: Phrase,
): Promise<PronunciationFeedback | null> {
  if (audio.byteLength < 800) return null;

  const fromAudio = await assessWithAudio(audio, mime, phrase);
  if (fromAudio) return fromAudio;

  const heard = await transcribe(audio, mime);
  if (heard == null) return null;
  return polishFromTranscript(phrase, heard, alignWords(phrase.sentence, heard));
}
