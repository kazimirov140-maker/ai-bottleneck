import { useState, useEffect } from "react";
import { get, set } from "idb-keyval";
import { Lang, WIN1_MODELS, WIN2_MODELS, WIN3_MODELS, ANALYST_MODELS } from "@/lib/i18n";

export type Message = { role: "user" | "assistant" | "system", content: string };

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  win1: Message[];
  win2: Message[];
  win3: Message[];
  analyst: Message[];
  analystPrompt: string;
};

export function useChatSession(lang: Lang) {
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<"idle" | "workers" | "analyst">("idle");
  const [failedModels, setFailedModels] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [models, setModels] = useState({
    win1: WIN1_MODELS[0],
    win2: WIN2_MODELS[0],
    win3: WIN3_MODELS[0],
    analyst: ANALYST_MODELS[0]
  });

  useEffect(() => {
    async function load() {
      try {
        const savedSessions = await get<Record<string, ChatSession>>("bottleneck_sessions");
        if (savedSessions) setSessions(savedSessions);
        
        const savedActiveId = await get<string>("bottleneck_activeId");
        if (savedActiveId) setActiveId(savedActiveId);

        const savedFailedModels = await get<string[]>("bottleneck_failedModels");
        if (savedFailedModels) setFailedModels(savedFailedModels);
      } catch (e) {
        console.error("Failed to load state from indexedDB", e);
      }
      setIsLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    set("bottleneck_sessions", sessions).catch(console.error);
    if (activeId) set("bottleneck_activeId", activeId).catch(console.error);
    set("bottleneck_failedModels", failedModels).catch(console.error);
  }, [sessions, activeId, failedModels, isLoaded]);

  useEffect(() => {
    setModels(prev => {
      let next = { ...prev };
      if (failedModels.includes(next.win1.id)) next.win1 = WIN1_MODELS.find(m => !failedModels.includes(m.id)) || WIN1_MODELS[0];
      if (failedModels.includes(next.win2.id)) next.win2 = WIN2_MODELS.find(m => !failedModels.includes(m.id)) || WIN2_MODELS[0];
      if (failedModels.includes(next.win3.id)) next.win3 = WIN3_MODELS.find(m => !failedModels.includes(m.id)) || WIN3_MODELS[0];
      if (failedModels.includes(next.analyst.id)) next.analyst = ANALYST_MODELS.find(m => !failedModels.includes(m.id)) || ANALYST_MODELS[0];
      return next;
    });
  }, [failedModels]);

  const activeSession = activeId ? sessions[activeId] : null;

  return {
    sessions, setSessions,
    activeId, setActiveId,
    activeSession,
    loadingPhase, setLoadingPhase,
    failedModels, setFailedModels,
    isLoaded,
    models, setModels
  };
}
