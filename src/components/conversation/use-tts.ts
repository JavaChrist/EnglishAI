"use client";

import * as React from "react";

type Voice = "male" | "female";

/**
 * Text-to-speech playback for the coach's messages via ElevenLabs.
 * Caches generated audio per text so replays are instant, and supports a
 * slowed-down playback ("Replay slowly") using the audio element rate.
 */
export function useTts(voice: Voice) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const cacheRef = React.useRef<Map<string, string>>(new Map());
  const [speakingId, setSpeakingId] = React.useState<string | null>(null);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const stop = React.useCallback(() => {
    audioRef.current?.pause();
    setSpeakingId(null);
  }, []);

  const speak = React.useCallback(
    async (id: string, text: string, opts?: { slow?: boolean }) => {
      const clean = text.trim();
      if (!clean) return;

      audioRef.current?.pause();

      try {
        let url = cacheRef.current.get(clean);
        if (!url) {
          setLoadingId(id);
          const res = await fetch("/api/voice/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: clean, voice }),
          });
          if (!res.ok) throw new Error(`TTS ${res.status}`);
          const blob = await res.blob();
          url = URL.createObjectURL(blob);
          cacheRef.current.set(clean, url);
        }

        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = url;
        audio.playbackRate = opts?.slow ? 0.7 : 1;
        audio.onended = () => setSpeakingId(null);
        audio.onpause = () => setSpeakingId((prev) => (prev === id ? null : prev));

        setLoadingId(null);
        setSpeakingId(id);
        await audio.play();
      } catch (error) {
        console.error("[useTts] playback failed", error);
        setLoadingId(null);
        setSpeakingId(null);
      }
    },
    [voice],
  );

  React.useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      audioRef.current?.pause();
      cache.forEach((url) => URL.revokeObjectURL(url));
      cache.clear();
    };
  }, []);

  return { speak, stop, speakingId, loadingId };
}
