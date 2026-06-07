"use client";

import { useState, useEffect, useRef } from "react";
import { T, WORKER_MODELS, JUDGE_MODELS, Lang } from "@/lib/i18n";
import { Play, Mic, MicOff, SquarePen, Expand, Settings, Paperclip } from "lucide-react";

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
    // Only scroll if there's actual content changing and we are idle, otherwise users might be reading.
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
    
    // Update local state early
    setSessions(prev => ({ ...prev, [currentSession!.id]: currentSession! }));
    setLoadingPhase("workers");

    try {
      // PHASE 1: Workers
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

      // PHASE 2: Analyst
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
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="glass-panel p-8 max-w-2xl w-full mx-4 text-center flex flex-col items-center">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto mb-2 object-contain drop-shadow-[0_0_20px_rgba(168,139,255,0.8)]" />
          <h1 className="text-4xl font-bold neon-text mb-6">Bottleneck</h1>
          
          <div className="flex gap-4 justify-center mb-8">
            <button onClick={() => setLang("ru")} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">🇷🇺 Русский</button>
            <button onClick={() => setLang("en")} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">🇬🇧 English</button>
            <button onClick={() => setLang("es")} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">🇪🇸 Español</button>
          </div>

          <div className="text-left text-white/80 whitespace-pre-wrap leading-relaxed bg-black/20 p-6 rounded-xl mb-8 border border-white/5">
            {T[lang].welcomeText}
          </div>

          <button onClick={() => setWelcomeSeen(true)} className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 font-bold text-lg shadow-[0_0_20px_rgba(168,139,255,0.4)] transition-all hover:scale-[1.02]">
            {T[lang].start}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex text-foreground overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`transition-all duration-300 glass-panel border-l-0 border-y-0 rounded-none flex flex-col z-20 ${sidebarOpen ? 'w-72' : 'w-0 -translate-x-full'}`}>
        <div className="p-4 flex-1 flex flex-col overflow-hidden min-w-72">
          <button 
            onClick={() => { setActiveId(null); setInput(""); }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary/80 to-purple-500/80 hover:from-primary hover:to-purple-500 font-bold mb-6 shadow-[0_0_15px_rgba(168,139,255,0.3)] transition"
          >
            + {T[lang].new_chat}
          </button>

          <div className="text-xs uppercase tracking-widest text-white/50 mb-4">{T[lang].history}</div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {Object.values(sessions).length === 0 && <div className="text-sm text-white/40">{T[lang].no_history}</div>}
            {Object.values(sessions).reverse().map(s => (
              <button 
                key={s.id} 
                onClick={() => setActiveId(s.id)}
                className={`w-full text-left p-3 rounded-lg text-sm truncate transition ${activeId === s.id ? 'bg-white/20 border border-white/10' : 'hover:bg-white/5 text-white/70'}`}
              >
                {s.title}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-sm text-white/60">
            <Settings className="w-4 h-4" />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as Lang)}
              className="bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="ru" className="bg-background">🇷🇺 RU</option>
              <option value="en" className="bg-background">🇬🇧 EN</option>
              <option value="es" className="bg-background">🇪🇸 ES</option>
            </select>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen relative">
        {/* Header toggle */}
        <div className="p-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 glass-panel rounded-lg hover:bg-white/10 transition">
            <SquarePen className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="AI Bottleneck Logo" className="h-7 w-auto object-contain drop-shadow-[0_0_10px_rgba(168,139,255,0.5)]" />
            <h2 className="text-xl font-bold neon-text">Bottleneck</h2>
          </div>
        </div>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto pb-48 px-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {/* Last User Message Display (if active) */}
            {activeSession && activeSession.messages.length > 0 && (
              <div className="glass-panel p-4 rounded-xl border border-primary/20">
                <div className="text-xs uppercase tracking-widest text-primary mb-2">{T[lang].prompt}</div>
                <div className="text-white/90">{activeSession.messages[activeSession.messages.length-1].content}</div>
              </div>
            )}

            {/* 3 Workers Row */}
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
                      {history.map((m, i) => (
                        <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-primary/10 border border-primary/20 ml-8' : 'bg-white/5 mr-8'}`}>
                          {m.content}
                        </div>
                      ))}
                      {loadingPhase === "workers" && <div className="text-primary animate-pulse text-sm">⏳ Генерация...</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Analyst Section */}
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
                {activeSession && activeSession.analyst.map((m, i) => (
                   <div key={i} className={`p-4 mb-4 rounded-xl ${m.role === 'user' ? 'bg-teal-900/20 border border-teal-500/20 ml-12' : 'bg-white/5 mr-12 whitespace-pre-wrap leading-relaxed'}`}>
                     {m.content}
                   </div>
                ))}
                {loadingPhase === "analyst" && <div className="text-teal-400 animate-pulse">🧠 Анализирую ответы и синтезирую финальный результат...</div>}
                <div ref={messagesEndRef} />
              </div>
            </div>

          </div>
        </div>

        {/* Fixed Chat Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
          <div className="max-w-[1200px] mx-auto relative pointer-events-auto">
            <div className="glass-panel p-2 pl-4 flex items-end gap-2 border border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              <button onClick={() => alert(T[lang].file_notice_text)} className="p-3 text-white/50 hover:text-white transition hover:bg-white/10 rounded-xl">
                <Paperclip className="w-5 h-5" />
              </button>

              <textarea 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={T[lang].chat_input}
                className="flex-1 bg-transparent border-none outline-none resize-none min-h-[50px] max-h-[200px] py-3 text-white/90 placeholder:text-white/30"
                rows={Math.min(5, input.split('\n').length)}
              />

              <button 
                onClick={toggleVoice} 
                className={`p-3 transition rounded-xl mr-1 ${isRecording ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button 
                onClick={handleSend}
                disabled={loadingPhase !== "idle" || !input.trim()}
                className="p-3 bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white rounded-xl transition shadow-[0_0_15px_rgba(168,139,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>

            </div>
            <div className="text-center mt-2 text-[10px] text-white/30 uppercase tracking-widest">
              © 2026 AI Bottleneck.
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
