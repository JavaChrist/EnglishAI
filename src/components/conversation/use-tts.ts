"use client";

import * as React from "react";

type Voice = "male" | "female";

/**
 * Text-to-speech playback for the coach's messages via ElevenLabs.
 *
 * The <audio> element streams directly from the GET endpoint, so playback
 * starts as soon as the first bytes arrive (low latency) and the browser
 * caches responses for instant replays. "Replay slowly" uses playbackRate.
 */
export function useTts(voice: Voice) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [speakingId, setSpeakingId] = React.useState<string | null>(null);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const stop = React.useCallback(() => {
    audioRef.current?.pause();
    setSpeakingId(null);
    setLoadingId(null);
  }, []);

  const speak = React.useCallback(
    async (id: string, text: string, opts?: { slow?: boolean }) => {
      const clean = text.trim();
      if (!clean) return;

      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.pause();

      const params = new URLSearchParams({ voice, text: clean });
      audio.src = `/api/voice/generate?${params.toString()}`;
      audio.playbackRate = opts?.slow ? 0.7 : 1;
      audio.onplaying = () => {
        setLoadingId(null);
        setSpeakingId(id);
      };
      audio.onended = () => setSpeakingId(null);
      audio.onerror = () => {
        setLoadingId(null);
        setSpeakingId(null);
      };

      setLoadingId(id);
      try {
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
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  return { speak, stop, speakingId, loadingId };
}
