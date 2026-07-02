"use client";

import * as React from "react";

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  0: RecognitionAlternative;
  isFinal: boolean;
  length: number;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
}

type Options = {
  lang: string;
  /** Live preview of what is being recognised (interim + final). */
  onChange: (text: string) => void;
  /** Called once the learner stops the mic, with the final transcript. */
  onFinalize: (text: string) => void;
};

/** Errors that mean we must NOT auto-restart (permission / hardware). */
const FATAL_ERRORS = new Set([
  "not-allowed",
  "service-not-allowed",
  "audio-capture",
]);

/**
 * Browser speech-to-text (Web Speech API). Chrome ends a session on short
 * silences, so we auto-restart it while the learner wants the mic on — this
 * keeps a stable "listening" state until they explicitly stop, then sends the
 * accumulated transcript.
 */
export function useSpeechRecognition({ lang, onChange, onFinalize }: Options) {
  const [supported, setSupported] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const recRef = React.useRef<SpeechRecognitionLike | null>(null);
  const finalRef = React.useRef("");
  const wantRef = React.useRef(false);
  const onChangeRef = React.useRef(onChange);
  const onFinalizeRef = React.useRef(onFinalize);
  onChangeRef.current = onChange;
  onFinalizeRef.current = onFinalize;

  React.useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = true;

    rec.onstart = () => {
      setListening(true);
    };
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalRef.current = `${finalRef.current} ${transcript}`.trim();
        } else {
          interim += transcript;
        }
      }
      onChangeRef.current(`${finalRef.current} ${interim}`.trim());
    };
    rec.onerror = (event) => {
      console.debug("[speech] error", event.error);
      setError(event.error || "speech-error");
      if (FATAL_ERRORS.has(event.error)) {
        wantRef.current = false;
      }
    };
    rec.onend = () => {
      console.debug("[speech] end (want =", wantRef.current, ")");
      // Chrome auto-stops on silence: restart while the user still wants it on.
      if (wantRef.current) {
        try {
          rec.start();
          return;
        } catch {
          // fall through to stop
        }
      }
      setListening(false);
      const text = finalRef.current.trim();
      finalRef.current = "";
      if (text) onFinalizeRef.current(text);
    };

    recRef.current = rec;
    setSupported(true);

    return () => {
      wantRef.current = false;
      try {
        rec.abort();
      } catch {
        // ignore
      }
      recRef.current = null;
    };
  }, [lang]);

  const start = React.useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    finalRef.current = "";
    wantRef.current = true;
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch {
      // already started — ignore
    }
  }, []);

  const stop = React.useCallback(() => {
    wantRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  return { supported, listening, error, start, stop };
}
