"use client";

import { useState, useEffect, useRef } from "react";
import { T, WORKER_MODELS, JUDGE_MODELS, Lang } from "@/lib/i18n";
import { Menu, Expand } from "lucide-react";
import { WelcomeModal } from "@/components/WelcomeModal";
import { Sidebar } from "@/components/Sidebar";
import { ChatInput } from "@/components/ChatInput";

type Message = { role: "user" | "assistant" | "system", content: string };

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  win1: Message[];
  win2: Message[];
  win3: Message[];
  analyst: Message[];
  analystPrompt: string;
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("ru");
  const [welcomeSeen, setWelcomeSeen] = useState(false);
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"idle" | "workers" | "analyst">("idle");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [models, setModels] = useState({
    win1: WORKER_MODELS[0],
    win2: WORKER_MODELS[1],
    win3: WORKER_MODELS[2],
    analyst: JUDGE_MODELS[0]
  });

  const [analystPrompt, setAnalystPrompt] = useState(T[lang].defaultAnalystPrompt);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loadingPhase === "idle") {
       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessions, activeId, loadingPhase]);

  const activeSession = activeId ? sessions[activeId] : null;

  const handleSend = async () => {
    if (!input.trim() || loadingPhase !== "idle") return;

    const userMsg = input.trim();
    setInput("");
    
    let currentSession = activeSession;
    if (!currentSession) {
      const newId = Date.now().toString();
      currentSession = {
        id: newId,
        title: userMsg.substring(0, 30) + "...",
        messages: [{ role: "user", content: userMsg }],
        win1: [], win2: [], win3: [], analyst: [],
        analystPrompt
      };
      setActiveId(newId);
    } else {
      currentSession = {
        ...currentSession,
        messages: [...currentSession.messages, { role: "user", content: userMsg }]
      };
    }
    
    setSessions(prev => ({ ...prev, [currentSession!.id]: currentSession! }));
    setLoadingPhase("workers");

    try {
      const workersRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "workers",
          models,
          messages: {
            win1: [...currentSession.win1, { role: "user", content: userMsg }],
            win2: [...currentSession.win2, { role: "user", content: userMsg }],
            win3: [...currentSession.win3, { role: "user", content: userMsg }]
          }
        })
      });
      const wData = await workersRes.json();
      
      currentSession.win1.push({ role: "user", content: userMsg }, { role: "assistant", content: wData.ans1 });
      currentSession.win2.push({ role: "user", content: userMsg }, { role: "assistant", content: wData.ans2 });
      currentSession.win3.push({ role: "user", content: userMsg }, { role: "assistant", content: wData.ans3 });
      
      setSessions(prev => ({ ...prev, [currentSession!.id]: currentSession! }));
      setLoadingPhase("analyst");

      const analystRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "analyst",
          models,
          analystPrompt: currentSession.analystPrompt,
          messages: [...currentSession.analyst, { role: "user", content: userMsg }],
          workerAnswers: [wData.ans1, wData.ans2, wData.ans3]
        })
      });
      const aData = await analystRes.json();
      
      currentSession.analyst.push({ role: "user", content: userMsg }, { role: "assistant", content: aData.ansAnalyst });
      setSessions(prev => ({ ...prev, [currentSession!.id]: currentSession! }));

    } catch (err) {
      console.error(err);
      alert("Error generating response.");
    } finally {
      setLoadingPhase("idle");
    }
  };

  const toggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Ваш браузер не поддерживает встроенное распознавание голоса.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = lang === "ru" ? "ru-RU" : lang === "es" ? "es-ES" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInput(prev => prev + " " + finalTranscript);
      }
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    
    recognition.start();
  };

  if (!welcomeSeen) {
    return <WelcomeModal lang={lang} setLang={setLang} setWelcomeSeen={setWelcomeSeen} />;
  }

  return (
    <div className="min-h-screen flex text-foreground overflow-hidden">
      <Sidebar 
        lang={lang} setLang={setLang} sidebarOpen={sidebarOpen} 
        sessions={sessions} activeId={activeId} setActiveId={setActiveId} setInput={setInput} 
      />

      <main className="flex-1 flex flex-col h-screen relative">
        <div className="p-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 glass-panel rounded-lg hover:bg-white/10 transition">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-7 w-auto object-contain drop-shadow-[0_0_10px_rgba(168,139,255,0.5)]" />
            <h2 className="text-xl font-bold neon-text">Bottleneck</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-48 px-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {activeSession && activeSession.messages.length > 0 && (
              <div className="glass-panel p-4 rounded-xl border border-primary/20">
                <div className="text-xs uppercase tracking-widest text-primary mb-2">{T[lang].prompt}</div>
                <div className="text-white/90">{activeSession.messages[activeSession.messages.length-1].content}</div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((num) => {
                const wKey = `win${num}` as keyof typeof models;
                const history = activeSession ? activeSession[wKey as keyof ChatSession] as Message[] : [];
                return (
                  <div key={num} className="glass-panel p-5 flex flex-col h-[500px]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-white/80 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        {T[lang].window} {num}
                      </h3>
                      <button className="p-1.5 hover:bg-white/10 rounded-md transition text-white/50"><Expand className="w-4 h-4" /></button>
                    </div>
                    
                    <select 
                      value={models[wKey].id}
                      onChange={(e) => setModels(m => ({ ...m, [wKey]: WORKER_MODELS.find(x => x.id === e.target.value)! }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white/80 mb-4 focus:outline-none focus:border-primary/50"
                    >
                      {WORKER_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-sm text-white/80">
                      {history.length === 0 && <div className="text-white/30 italic">{T[lang].waiting}</div>}
                      {history.filter(m => m.role !== 'user').map((m, i) => (
                        <div key={i} className="p-3 rounded-lg bg-white/5 mr-8">
                          {m.content}
                        </div>
                      ))}
                      {loadingPhase === "workers" && <div className="text-primary animate-pulse text-sm">⏳ Генерация...</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="glass-panel p-6 border-[2px] border-teal-400/50 shadow-[0_0_30px_rgba(45,212,191,0.15)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-yellow-400/5 pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="font-bold text-lg bg-gradient-to-r from-teal-400 to-yellow-400 bg-clip-text text-transparent flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_#2dd4bf] animate-pulse" />
                  {T[lang].finalTitle}
                </h3>
                <button className="p-1.5 hover:bg-white/10 rounded-md transition text-white/50"><Expand className="w-4 h-4" /></button>
              </div>

              <select 
                value={models.analyst.id}
                onChange={(e) => setModels(m => ({ ...m, analyst: JUDGE_MODELS.find(x => x.id === e.target.value)! }))}
                className="w-full lg:w-1/3 bg-black/40 border border-teal-400/20 rounded-lg p-2 text-sm text-teal-100 mb-4 focus:outline-none focus:border-teal-400/50 relative z-10"
              >
                {JUDGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>

              <textarea 
                value={analystPrompt}
                onChange={(e) => {
                  setAnalystPrompt(e.target.value);
                  if (activeSession) {
                    setSessions(s => ({...s, [activeId!]: {...s[activeId!], analystPrompt: e.target.value}}));
                  }
                }}
                className="w-full bg-black/20 border border-teal-400/20 rounded-lg p-3 text-xs text-teal-100/70 mb-4 focus:outline-none focus:border-teal-400/50 min-h-[60px] relative z-10"
                placeholder="Системный промпт Аналитика..."
              />

              <div className="min-h-[200px] max-h-[600px] overflow-y-auto p-4 bg-black/20 rounded-xl border border-white/5 text-white/90 relative z-10">
                {(!activeSession || activeSession.analyst.length === 0) && <div className="text-white/30 italic">{T[lang].judge_waiting}</div>}
                {activeSession && activeSession.analyst.filter(m => m.role !== 'user').map((m, i) => (
                   <div key={i} className="p-4 mb-4 rounded-xl bg-white/5 mr-12 whitespace-pre-wrap leading-relaxed">
                     {m.content}
                   </div>
                ))}
                {loadingPhase === "analyst" && <div className="text-teal-400 animate-pulse">🧠 Анализирую ответы и синтезирую финальный результат...</div>}
                <div ref={messagesEndRef} />
              </div>
            </div>

          </div>
        </div>

        <ChatInput 
          lang={lang} input={input} setInput={setInput} 
          isRecording={isRecording} toggleVoice={toggleVoice} 
          handleSend={handleSend} loadingPhase={loadingPhase} 
        />

      </main>
    </div>
  );
}
