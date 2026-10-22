"use client";

import * as React from "react";

type Options = {
  /** When false, speech is ignored (coach talking, assessment in flight). */
  enabled: boolean;
  onUtterance: (blob: Blob, seconds: number) => void;
};

const SILENCE_MS = 1000;
const MIN_SPEECH_MS = 500;
const MAX_SPEECH_MS = 18000;

/**
 * Keeps the microphone open and sends one clip each time the learner
 * finishes a phrase. The stream stays up for the whole visit.
 */
export function useOpenMic({ enabled, onUtterance }: Options) {
  const [supported, setSupported] = React.useState(false);
  const [live, setLive] = React.useState(false);
  const [hearing, setHearing] = React.useState(false);
  const [needsTap, setNeedsTap] = React.useState(false);

  const onUtteranceRef = React.useRef(onUtterance);
  const enabledRef = React.useRef(enabled);

  React.useEffect(() => {
    onUtteranceRef.current = onUtterance;
    enabledRef.current = enabled;
  }, [onUtterance, enabled]);

  const streamRef = React.useRef<MediaStream | null>(null);
  const ctxRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const samplesRef = React.useRef<Uint8Array<ArrayBuffer> | null>(null);
  const hearingRef = React.useRef(false);
  const speechAtRef = React.useRef(0);
  const lastVoiceRef = React.useRef(0);
  const noiseRef = React.useRef(0.015);
  const loudRunRef = React.useRef(0);
  const discardRef = React.useRef(false);
  const resumeAtRef = React.useRef(0);

  const release = React.useCallback(() => {
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        discardRef.current = true;
        recorderRef.current.stop();
      }
    } catch {
      // The recorder may already be stopped.
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    analyserRef.current = null;
    hearingRef.current = false;
  }, []);

  const finishCapture = React.useCallback((send: boolean) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      hearingRef.current = false;
      setHearing(false);
      return;
    }
    discardRef.current = !send;
    try {
      recorder.stop();
    } catch {
      hearingRef.current = false;
      setHearing(false);
    }
  }, []);

  const beginCapture = React.useCallback(() => {
    const stream = streamRef.current;
    if (!stream || hearingRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const seconds = Math.max(
        1,
        Math.round((Date.now() - speechAtRef.current) / 1000),
      );
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      chunksRef.current = [];
      hearingRef.current = false;
      recorderRef.current = null;
      setHearing(false);
      if (!discardRef.current && blob.size > 800) {
        onUtteranceRef.current(blob, seconds);
      }
    };
    recorderRef.current = recorder;
    const now = Date.now();
    speechAtRef.current = now;
    lastVoiceRef.current = now;
    hearingRef.current = true;
    loudRunRef.current = 0;
    setHearing(true);
    recorder.start();
  }, []);

  const arm = React.useCallback(async () => {
    if (streamRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    const ctx = new AudioContext();
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // Some browsers only resume audio after a tap.
      }
    }
    if (ctx.state === "suspended") {
      stream.getTracks().forEach((track) => track.stop());
      await ctx.close();
      setNeedsTap(true);
      return;
    }
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analyser);
    streamRef.current = stream;
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    samplesRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize));
    setNeedsTap(false);
    setLive(true);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setSupported(
        !!navigator.mediaDevices?.getUserMedia &&
          typeof MediaRecorder !== "undefined" &&
          typeof AudioContext !== "undefined",
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void arm()
        .then(() => {
          if (cancelled) release();
        })
        .catch((err: Error) => {
          if (cancelled) return;
          console.error("[useOpenMic] arm failed", err);
          setNeedsTap(err.name === "NotAllowedError" || err.name === "SecurityError");
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      release();
      setLive(false);
    };
  }, [supported, arm, release]);

  React.useEffect(() => {
    if (enabled) return;
    resumeAtRef.current = Date.now() + 800;
    if (hearingRef.current) finishCapture(false);
  }, [enabled, finishCapture]);

  React.useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => {
      const analyser = analyserRef.current;
      const samples = samplesRef.current;
      if (!analyser || !samples) return;
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i++) {
        const centered = ((samples[i] ?? 128) - 128) / 128;
        sum += centered * centered;
      }
      const rms = Math.sqrt(sum / samples.length);
      const now = Date.now();
      const loud = rms > Math.max(0.03, noiseRef.current * 3.2);

      if (!hearingRef.current) {
        noiseRef.current = noiseRef.current * 0.95 + rms * 0.05;
        if (!enabledRef.current || now < resumeAtRef.current) {
          loudRunRef.current = 0;
          return;
        }
        loudRunRef.current = loud ? loudRunRef.current + 1 : 0;
        if (loudRunRef.current >= 3) beginCapture();
        return;
      }

      if (loud) lastVoiceRef.current = now;
      const spokeFor = now - speechAtRef.current;
      const quietFor = now - lastVoiceRef.current;
      if (!enabledRef.current) {
        finishCapture(false);
        return;
      }
      if (spokeFor >= MAX_SPEECH_MS || (spokeFor >= MIN_SPEECH_MS && quietFor >= SILENCE_MS)) {
        finishCapture(true);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [live, beginCapture, finishCapture]);

  return { supported, live, hearing, needsTap, arm };
}
