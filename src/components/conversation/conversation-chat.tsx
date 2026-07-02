"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowLeft, Loader2, Mic, Send, Square, Volume2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Mascot } from "@/components/mascot/mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecorder } from "@/components/conversation/use-recorder";
import { useTts } from "@/components/conversation/use-tts";
import { cn } from "@/lib/utils";
import type { Accent, Voice } from "@/types/database";

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export function ConversationChat({
  conversationId,
  scenario,
  label,
  opener,
  voice,
}: {
  conversationId: string;
  scenario: string;
  label: string;
  opener: string;
  voice: Voice;
  accent: Accent;
}) {
  const [input, setInput] = React.useState("");
  const [transcribing, setTranscribing] = React.useState(false);
  const [micHint, setMicHint] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const spokenRef = React.useRef<Set<string>>(new Set());

  const { speak, stop: stopTts, speakingId, loadingId } = useTts(voice);

  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        prepareSendMessagesRequest({ messages }) {
          return { body: { messages, scenario, conversationId } };
        },
      }),
    [scenario, conversationId],
  );

  const initialMessages = React.useMemo<UIMessage[]>(
    () => [
      {
        id: "opener",
        role: "assistant",
        parts: [{ type: "text", text: opener }],
      },
    ],
    [opener],
  );

  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
  });

  const busy = status === "submitted" || status === "streaming";
  const waiting = status === "submitted";

  const send = React.useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      stopTts();
      sendMessage({ text: t });
      setInput("");
    },
    [sendMessage, stopTts],
  );

  const handleRecorded = React.useCallback(
    async (blob: Blob) => {
      setTranscribing(true);
      setMicHint("Transcribing…");
      try {
        const form = new FormData();
        form.append("file", blob, "speech.webm");
        const res = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error(`Transcribe ${res.status}`);
        const { text } = (await res.json()) as { text: string };
        if (text?.trim()) {
          send(text);
          setMicHint(null);
        } else {
          setMicHint("I didn't catch that — try speaking again.");
        }
      } catch (err) {
        console.error("[transcribe] failed", err);
        setMicHint("Couldn't transcribe the audio. Please try again.");
      } finally {
        setTranscribing(false);
      }
    },
    [send],
  );

  const recorder = useRecorder({ onRecorded: handleRecorded });

  // Auto-speak the coach's replies once generation settles.
  React.useEffect(() => {
    if (busy) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    if (spokenRef.current.has(last.id)) return;
    spokenRef.current.add(last.id);
    void speak(last.id, messageText(last));
  }, [messages, busy, speak]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, waiting]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    send(input);
  }

  function toggleMic() {
    if (recorder.recording) {
      recorder.stop();
    } else {
      stopTts();
      setMicHint(null);
      void recorder.start();
    }
  }

  const recorderHint = recorder.recording
    ? "Recording… tap the mic again to send."
    : recorder.error === "NotAllowedError"
      ? "Microphone access is blocked. Allow it and try again."
      : recorder.error === "NotFoundError"
        ? "No microphone found. Check your device settings."
        : recorder.error
          ? `Microphone issue: ${recorder.error}`
          : micHint;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/60">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back"
            render={<Link href="/conversation" />}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <p className="text-sm font-medium leading-none">{label}</p>
            <p className="text-xs text-muted-foreground">Conversation Lab</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
          {messages.map((message) => {
            const isUser = message.role === "user";
            const text = messageText(message);
            const isSpeaking = speakingId === message.id;
            const isLoading = loadingId === message.id;
            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-end gap-2",
                  isUser ? "justify-end" : "justify-start",
                )}
              >
                {!isUser && <Mascot size="sm" className="size-8 shrink-0" />}
                <div className="flex flex-col gap-1">
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                      isUser
                        ? "self-end rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground",
                    )}
                  >
                    {text}
                  </div>
                  {!isUser && text.trim().length > 0 && (
                    <div className="flex items-center gap-1 pl-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                        onClick={() =>
                          isSpeaking ? stopTts() : void speak(message.id, text)
                        }
                        aria-label={isSpeaking ? "Stop" : "Play"}
                      >
                        {isLoading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : isSpeaking ? (
                          <Square className="size-3.5 fill-current" />
                        ) : (
                          <Volume2 className="size-3.5" />
                        )}
                        {isSpeaking ? "Stop" : "Play"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                        onClick={() => void speak(message.id, text, { slow: true })}
                        aria-label="Replay slowly"
                      >
                        <Volume2 className="size-3.5" />
                        Slow
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {waiting && (
            <div className="flex items-end gap-2">
              <Mascot size="sm" className="size-8 shrink-0" />
              <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                <span className="flex gap-1">
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60" />
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/80 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        {recorderHint && (
          <div className="mx-auto w-full max-w-2xl px-4 pt-2">
            <p className="text-xs text-muted-foreground">{recorderHint}</p>
          </div>
        )}
        <form
          onSubmit={onSubmit}
          className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3"
        >
          {recorder.supported && (
            <Button
              type="button"
              size="icon"
              variant={recorder.recording ? "default" : "outline"}
              className={cn(
                "size-11 shrink-0",
                recorder.recording && "animate-pulse",
              )}
              onClick={toggleMic}
              disabled={transcribing}
              aria-label={recorder.recording ? "Stop and send" : "Speak"}
            >
              {transcribing ? (
                <Loader2 className="size-5 animate-spin" />
              ) : recorder.recording ? (
                <Square className="size-5 fill-current" />
              ) : (
                <Mic className="size-5" />
              )}
            </Button>
          )}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              recorder.recording
                ? "Recording… tap the mic to send"
                : "Type or tap the mic to speak..."
            }
            className="h-11"
            disabled={recorder.recording || transcribing}
          />
          <Button
            type="submit"
            size="icon"
            className="size-11 shrink-0"
            disabled={!input.trim() || busy}
            aria-label="Send"
          >
            <Send className="size-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
