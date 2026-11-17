// src/features/reader/useVoiceReader.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as Speech from "expo-speech";

export type SpeechState = "idle" | "speaking" | "paused";

export function useVoiceReader() {
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const lastCharIndexRef = useRef<number>(0);
  const currentTextRef = useRef<string>("");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      Speech.stop().catch(() => {});
    };
  }, []);

  const stop = useCallback(async () => {
    try {
      await Speech.stop();
    } catch {
      // Ignore errors if TTS isn't currently speaking
    } finally {
      if (isMountedRef.current) {
        lastCharIndexRef.current = 0;
        currentTextRef.current = "";
        setSpeechState("idle");
        setError(null);
      }
    }
  }, []);

  const startSpeakingFromOffset = useCallback(
    async (text: string, offset: number) => {
      const textToSpeak = offset > 0 ? text.slice(offset) : text;
      if (!textToSpeak || textToSpeak.trim().length === 0) {
        if (isMountedRef.current) {
          setSpeechState("idle");
        }
        return;
      }

      currentTextRef.current = text;
      lastCharIndexRef.current = offset;

      try {
        await Speech.stop();

        if (isMountedRef.current) {
          setError(null);
          setSpeechState("speaking");
        }

        Speech.speak(textToSpeak, {
          language: "en",
          onStart: () => {
            if (isMountedRef.current) {
              setSpeechState("speaking");
            }
          },
          onBoundary: (event: any) => {
            if (event && typeof event.charIndex === "number") {
              lastCharIndexRef.current = offset + event.charIndex;
            }
          },
          onDone: () => {
            if (isMountedRef.current) {
              lastCharIndexRef.current = 0;
              setSpeechState("idle");
            }
          },
          onStopped: () => {
            if (isMountedRef.current) {
              setSpeechState("idle");
            }
          },
          onError: (err) => {
            if (isMountedRef.current) {
              setSpeechState("idle");
              setError("Text-to-speech error occurred.");
              Alert.alert("Voice Reader", "Unable to read this text at the moment.");
            }
          },
        });
      } catch (err) {
        if (isMountedRef.current) {
          setSpeechState("idle");
          setError("Failed to start text-to-speech.");
          Alert.alert("Voice Reader", "Failed to start audio playback.");
        }
      }
    },
    [],
  );

  const resume = useCallback(async () => {
    if (speechState !== "paused") return;

    try {
      if (Speech.resume) {
        await Speech.resume();
        if (isMountedRef.current) {
          setSpeechState("speaking");
        }
      } else {
        // Fallback: start speaking from saved character index
        await startSpeakingFromOffset(
          currentTextRef.current,
          lastCharIndexRef.current,
        );
      }
    } catch {
      // Fallback if native resume fails
      try {
        await startSpeakingFromOffset(
          currentTextRef.current,
          lastCharIndexRef.current,
        );
      } catch {
        if (isMountedRef.current) {
          setSpeechState("idle");
        }
      }
    }
  }, [speechState, startSpeakingFromOffset]);

  const play = useCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) {
        Alert.alert("Voice Reader", "No text content available to read.");
        return;
      }

      // If currently paused, Play MUST resume from paused position!
      if (speechState === "paused") {
        await resume();
        return;
      }

      // If already speaking the same text, do nothing
      if (speechState === "speaking" && currentTextRef.current === text) {
        return;
      }

      // Otherwise start fresh from beginning
      lastCharIndexRef.current = 0;
      await startSpeakingFromOffset(text, 0);
    },
    [speechState, resume, startSpeakingFromOffset],
  );

  const pause = useCallback(async () => {
    if (speechState !== "speaking") return;

    try {
      if (Speech.pause) {
        await Speech.pause();
      }
      if (isMountedRef.current) {
        setSpeechState("paused");
      }
    } catch {
      // If pause throws error on current device, fallback to stop
      await stop();
    }
  }, [speechState, stop]);

  return {
    speechState,
    isSpeaking: speechState === "speaking",
    isPaused: speechState === "paused",
    isIdle: speechState === "idle",
    error,
    play,
    pause,
    resume,
    stop,
  };
}
