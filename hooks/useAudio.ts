import { useState, useRef } from "react";

export function useAudio() {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = async (text: string, currentLang: string, msgId: string) => {
    if (playingAudioId === msgId && audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
    }

    setAudioLoadingId(msgId);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: currentLang })
      });
      const data = await res.json();
      setAudioLoadingId(null);
      if (data.audioContent) {
        const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
        audioRef.current = audio;
        audio.onended = () => setPlayingAudioId(null);
        audio.play();
        setPlayingAudioId(msgId);
      }
    } catch (e) {
      console.error("Audio play failed", e);
      setAudioLoadingId(null);
    }
  };

  return { playingAudioId, audioLoadingId, playAudio };
}
