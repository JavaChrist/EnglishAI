"use client";

import * as React from "react";

type Options = {
  /** Called with the recorded audio once the learner stops. */
  onRecorded: (blob: Blob) => void;
};

/**
 * Records microphone audio via MediaRecorder. Works reliably across desktop
 * and mobile (Android + iOS Safari), unlike the Web Speech API. The captured
 * blob is handed off for server-side transcription (Whisper).
 */
export function useRecorder({ onRecorded }: Options) {
  const [supported, setSupported] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const onRecordedRef = React.useRef(onRecorded);
  onRecordedRef.current = onRecorded;

  React.useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined",
    );
  }, []);

  const stopTracks = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = React.useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stopTracks();
        setRecording(false);
        if (blob.size > 0) onRecordedRef.current(blob);
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("[useRecorder] start failed", err);
      setError((err as Error)?.name || "recorder-error");
      stopTracks();
      setRecording(false);
    }
  }, [stopTracks]);

  const stop = React.useCallback(() => {
    try {
      recorderRef.current?.stop();
    } catch {
      stopTracks();
      setRecording(false);
    }
  }, [stopTracks]);

  React.useEffect(() => stopTracks, [stopTracks]);

  return { supported, recording, error, start, stop };
}
