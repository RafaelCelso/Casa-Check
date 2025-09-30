"use client";

import { useState, useCallback } from "react";

export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const speak = useCallback(
    (
      text: string,
      options?: { rate?: number; pitch?: number; volume?: number }
    ) => {
      if (!("speechSynthesis" in window)) {
        console.warn("Text-to-speech não é suportado neste navegador");
        return;
      }

      // Parar qualquer fala em andamento
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Configurações padrão
      utterance.rate = options?.rate || 0.8;
      utterance.pitch = options?.pitch || 1;
      utterance.volume = options?.volume || 1;
      utterance.lang = "pt-BR";

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isPaused,
    isSupported: typeof window !== "undefined" && "speechSynthesis" in window,
  };
}
