"use client";

import { useState, useEffect, useRef } from "react";
import { T, WIN1_MODELS, WIN2_MODELS, WIN3_MODELS, JUDGE_MODELS, Lang } from "@/lib/i18n";
import { Menu, PanelLeftClose, Expand, Volume2, Square, X } from "lucide-react";
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
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [expandedView, setExpandedView] = useState<{title: string, messages: Message[], wKey: string} | null>(null);

  const [models, setModels] = useState({
    win1: WIN1_MODELS[0],
    win2: WIN2_MODELS[0],
    win3: WIN3_MODELS[0],
    analyst: JUDGE_MODELS[0]
  });

  const [analystPrompt, setAnalystPrompt] = useState(T[lang].defaultAnalystPrompt);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const win1Ref = useRef<HTMLDivElement>(null);
  const win2Ref = useRef<HTMLDivElement>(null);
  const win3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loadingPhase === "idle") {
       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
       win1Ref.current?.scrollIntoView({ behavior: "smooth" });
       win2Ref.current?.scrollIntoView({ behavior: "smooth" });
       win3Ref.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessions, activeId, loadingPhase]);

  const activeSession = activeId ? sessions[activeId] : null;

  const playAudio = async (text: string, currentLang: string, msgId: string) => {
    if (playingAudioId === msgId && audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setPlayingAudioId(msgId);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: currentLang })
      });
      const data = await res.json();
      if (data.audioContent) {
        const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
        audioRef.current = audio;
        audio.onended = () => setPlayingAudioId(null);
        audio.play();
      } else {
        setPlayingAudioId(null);
      }
    } catch (e) {
      console.error("Audio play failed", e);
      setPlayingAudioId(null);
    }
  };

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
      
      // Автоматическая озвучка ответа аналитика
      const newMsgId = `analyst-${currentSession.analyst.filter(m => m.role !== 'user').length - 1}`;
      playAudio(aData.ansAnalyst, lang, newMsgId);

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
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 glass-panel rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground flex items-center justify-center"
            title={sidebarOpen ? "Скрыть панель" : "Показать панель"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                <div className="text-foreground">{activeSession.messages[activeSession.messages.length-1].content}</div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((num) => {
                const wKey = `win${num}` as keyof typeof models;
                const history = activeSession ? activeSession[wKey as keyof ChatSession] as Message[] : [];
                const winModelsArray = num === 1 ? WIN1_MODELS : num === 2 ? WIN2_MODELS : WIN3_MODELS;
                return (
                  <div key={num} className="glass-panel p-5 flex flex-col h-[500px]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        {T[lang].window} {num}
                      </h3>
                      <button 
                        onClick={() => setExpandedView({ title: T[lang].window + " " + num, messages: history, wKey })}
                        className="p-1.5 hover:bg-muted rounded-md transition text-muted-foreground"
                      >
                        <Expand className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <select 
                      value={models[wKey].id}
                      onChange={(e) => setModels(m => ({ ...m, [wKey]: winModelsArray.find(x => x.id === e.target.value)! }))}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground mb-4 focus:outline-none focus:border-primary"
                    >
                      {winModelsArray.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-sm text-foreground/90">
                      {history.length === 0 && <div className="text-muted-foreground italic">{T[lang].waiting}</div>}
                      {history.filter(m => m.role !== 'user').map((m, i) => {
                        const msgId = `${wKey}-${i}`;
                        const isPlaying = playingAudioId === msgId;
                        return (
                          <div key={i} className="p-3 pr-10 rounded-lg bg-muted mr-2 border border-border relative">
                            {m.content}
                            <button 
                              onClick={() => playAudio(m.content, lang, msgId)}
                              className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${isPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-background'}`}
                              title={isPlaying ? "Остановить" : "Прослушать"}
                            >
                              {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                          </div>
                        );
                      })}
                      {loadingPhase === "workers" && <div className="text-primary animate-pulse text-sm">⏳ Генерация...</div>}
                      <div ref={num === 1 ? win1Ref : num === 2 ? win2Ref : win3Ref} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="glass-panel p-6 border-[2px] border-primary/50 shadow-[0_0_30px_rgba(168,139,255,0.15)] relative overflow-hidden transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(168,139,255,0.8)] animate-pulse" />
                  {T[lang].finalTitle}
                </h3>
                <button 
                  onClick={() => setExpandedView({ title: T[lang].finalTitle, messages: activeSession ? activeSession.analyst : [], wKey: 'analyst' })}
                  className="p-1.5 hover:bg-muted rounded-md transition text-muted-foreground"
                >
                  <Expand className="w-4 h-4" />
                </button>
              </div>

              <select 
                value={models.analyst.id}
                onChange={(e) => setModels(m => ({ ...m, analyst: JUDGE_MODELS.find(x => x.id === e.target.value)! }))}
                className="w-full lg:w-1/3 bg-background border border-primary/30 rounded-lg p-2 text-sm text-primary mb-4 focus:outline-none focus:border-primary relative z-10"
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
                className="w-full bg-background border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground mb-4 focus:outline-none focus:border-primary min-h-[60px] relative z-10"
                placeholder="Системный промпт Аналитика..."
              />

              <div className="min-h-[200px] max-h-[600px] overflow-y-auto p-4 bg-muted/50 rounded-xl border border-primary/10 text-foreground relative z-10">
                {(!activeSession || activeSession.analyst.length === 0) && <div className="text-muted-foreground italic">{T[lang].judge_waiting}</div>}
                {activeSession && activeSession.analyst.filter(m => m.role !== 'user').map((m, i) => {
                   const msgId = `analyst-${i}`;
                   const isPlaying = playingAudioId === msgId;
                   return (
                     <div key={i} className="p-4 pr-12 mb-4 rounded-xl bg-background border border-primary/20 mr-2 whitespace-pre-wrap leading-relaxed shadow-sm relative">
                       {m.content}
                       <button 
                         onClick={() => playAudio(m.content, lang, msgId)}
                         className={`absolute right-3 top-3 p-2 rounded-xl transition-all shadow-sm ${isPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-muted border border-primary/10'}`}
                         title={isPlaying ? "Остановить" : "Прослушать"}
                       >
                         {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Volume2 className="w-5 h-5" />}
                       </button>
                     </div>
                   );
                })}
                {loadingPhase === "analyst" && <div className="text-primary animate-pulse">🧠 Анализирую ответы и синтезирую финальный результат...</div>}
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

      {expandedView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-all duration-300">
          <div className="glass-panel p-6 w-full max-w-5xl h-[85vh] flex flex-col relative border border-primary/30 shadow-[0_0_40px_rgba(168,139,255,0.15)] animate-in zoom-in-95">
            <button onClick={() => setExpandedView(null)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted text-muted-foreground transition"><X className="w-6 h-6"/></button>
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(168,139,255,0.8)] animate-pulse" />
              {expandedView.title}
            </h2>
            <div className="flex-1 overflow-y-auto pr-4 space-y-6 text-lg text-foreground/90">
               {expandedView.messages.length === 0 && <div className="text-muted-foreground italic">{T[lang].waiting}</div>}
               {expandedView.messages.filter(m => m.role !== 'user').map((m, i) => {
                 const msgId = `expanded-${expandedView.wKey}-${i}`;
                 const isPlaying = playingAudioId === msgId;
                 return (
                   <div key={i} className="p-6 pr-16 rounded-xl bg-background border border-border shadow-sm relative whitespace-pre-wrap leading-relaxed">
                     {m.content}
                     <button 
                        onClick={() => playAudio(m.content, lang, msgId)}
                        className={`absolute right-4 top-4 p-2.5 rounded-xl transition-all shadow-sm ${isPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-muted border border-border'}`}
                        title={isPlaying ? "Остановить" : "Прослушать"}
                     >
                        {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Volume2 className="w-6 h-6" />}
                     </button>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
