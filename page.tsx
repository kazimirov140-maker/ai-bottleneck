"use client";

import { useState, useEffect, useRef } from "react";
import { T, WIN1_MODELS, WIN2_MODELS, WIN3_MODELS, ANALYST_MODELS, Lang } from "@/lib/i18n";
import { Menu, PanelLeftClose, Expand, Volume2, Square, X, Copy, Download } from "lucide-react";
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

  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentText, setAttachmentText] = useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const [models, setModels] = useState({
    win1: WIN1_MODELS[0],
    win2: WIN2_MODELS[0],
    win3: WIN3_MODELS[0],
    analyst: ANALYST_MODELS[0]
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
    if ((!input.trim() && !attachmentText) || loadingPhase !== "idle") return;

    let userMsg = input.trim();
    if (attachmentText) {
      userMsg += `\n\n--- Прикрепленный файл: ${attachmentName} ---\n${attachmentText}`;
    }
    
    setInput("");
    removeAttachment();
    
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
      let textToPlay = aData.ansAnalyst;
      try {
        const match = aData.ansAnalyst.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.final_answer) textToPlay = parsed.final_answer;
        }
      } catch(e){}
      playAudio(textToPlay, lang, newMsgId);

    } catch (err) {
      console.error(err);
      alert("Error generating response.");
    } finally {
      setLoadingPhase("idle");
    }
  };

  const handleDebate = async (divergences: string[]) => {
    if (loadingPhase !== "idle" || !activeSession) return;
    
    const debateMsg = `🤖 [АВТОМАТИЧЕСКИЙ РЕЖИМ ДЕБАТОВ]\nАналитик выявил расхождения между вашими ответами по следующим пунктам:\n${divergences.map(d => "- " + d).join('\n')}\n\nПожалуйста, аргументируйте свою позицию: почему ваш подход правильный, а другие мнения могут быть ошибочными.`;
    
    let currentSession = {
      ...activeSession,
      messages: [...activeSession.messages, { role: "user", content: debateMsg }]
    };
    
    setSessions(prev => ({ ...prev, [currentSession.id]: currentSession }));
    setLoadingPhase("workers");

    try {
      const workersRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "workers",
          models,
          messages: {
            win1: [...currentSession.win1, { role: "user", content: debateMsg }],
            win2: [...currentSession.win2, { role: "user", content: debateMsg }],
            win3: [...currentSession.win3, { role: "user", content: debateMsg }]
          }
        })
      });
      const wData = await workersRes.json();
      
      currentSession.win1.push({ role: "user", content: debateMsg }, { role: "assistant", content: wData.ans1 });
      currentSession.win2.push({ role: "user", content: debateMsg }, { role: "assistant", content: wData.ans2 });
      currentSession.win3.push({ role: "user", content: debateMsg }, { role: "assistant", content: wData.ans3 });
      
      setSessions(prev => ({ ...prev, [currentSession.id]: currentSession }));
      setLoadingPhase("analyst");

      const analystRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "analyst",
          models,
          analystPrompt: currentSession.analystPrompt,
          messages: [...currentSession.analyst, { role: "user", content: debateMsg }],
          workerAnswers: [wData.ans1, wData.ans2, wData.ans3]
        })
      });
      const aData = await analystRes.json();
      
      currentSession.analyst.push({ role: "user", content: debateMsg }, { role: "assistant", content: aData.ansAnalyst });
      setSessions(prev => ({ ...prev, [currentSession.id]: currentSession }));
      
      const newMsgId = `analyst-${currentSession.analyst.filter(m => m.role !== 'user').length - 1}`;
      let textToPlay = aData.ansAnalyst;
      try {
        const match = aData.ansAnalyst.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.final_answer) textToPlay = parsed.final_answer;
        }
      } catch(e){}
      playAudio(textToPlay, lang, newMsgId);

    } catch (err) {
      console.error(err);
      alert("Error generating debate response.");
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

  const parseAnalystResponse = (content: string) => {
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.final_answer) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  const getHallucinationCount = () => {
    if (!activeSession) return 0;
    let count = 0;
    activeSession.analyst.forEach(m => {
      if (m.role === 'assistant') {
        const parsed = parseAnalystResponse(m.content);
        if (parsed && parsed.corrections) {
          count += parsed.corrections.length;
        }
      }
    });
    return count;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAttachmentName(file.name);
    setIsUploadingAttachment(true);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.text) {
        setAttachmentText(data.text);
      } else {
        alert("Ошибка: " + (data.error || "Не удалось прочитать файл"));
        setAttachmentName(null);
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети при загрузке файла");
      setAttachmentName(null);
    } finally {
      setIsUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const removeAttachment = () => {
    setAttachmentName(null);
    setAttachmentText(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadText = (text: string, title: string) => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          <div className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,139,255,0.6)]" />
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
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(168,139,255,0.8)] animate-pulse" />
                    {T[lang].finalTitle}
                  </h3>
                  {activeSession && getHallucinationCount() > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold shadow-sm animate-in fade-in zoom-in" title="Количество исправлений, внесенных Аналитиком">
                      🚨 Галлюцинаций: {getHallucinationCount()}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setExpandedView({ title: T[lang].finalTitle, messages: activeSession ? activeSession.analyst : [], wKey: 'analyst' })}
                  className="p-1.5 hover:bg-muted rounded-md transition text-muted-foreground"
                >
                  <Expand className="w-4 h-4" />
                </button>
              </div>

              <select 
                value={models.analyst.id}
                onChange={(e) => setModels(m => ({ ...m, analyst: ANALYST_MODELS.find(x => x.id === e.target.value)! }))}
                className="w-full lg:w-1/3 bg-background border border-primary/30 rounded-lg p-2 text-sm text-primary mb-4 focus:outline-none focus:border-primary relative z-10"
              >
                {ANALYST_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
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
                {(!activeSession || activeSession.analyst.length === 0) && <div className="text-muted-foreground italic">{T[lang].analyst_waiting}</div>}
                {activeSession && activeSession.analyst.filter(m => m.role !== 'user').map((m, i) => {
                   const msgId = `analyst-${i}`;
                   const isPlaying = playingAudioId === msgId;
                   const parsed = parseAnalystResponse(m.content);
                   const textToPlay = parsed ? parsed.final_answer : m.content;
                   
                   return (
                     <div key={i} className="p-4 pr-12 mb-4 rounded-xl bg-background border border-primary/20 mr-2 shadow-sm relative">
                       {parsed ? (
                         <div className="flex flex-col gap-4">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                             {parsed.agreements && parsed.agreements.length > 0 && (
                               <div className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 p-3 rounded-lg">
                                 <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"/> Согласие:</strong>
                                 <ul className="list-disc pl-4 mt-2 space-y-1">
                                   {parsed.agreements.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                                 </ul>
                               </div>
                             )}
                             {parsed.divergences && parsed.divergences.length > 0 && (
                               <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 p-3 rounded-lg">
                                 <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"/> Расхождения:</strong>
                                 <ul className="list-disc pl-4 mt-2 space-y-1">
                                   {parsed.divergences.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                                 </ul>
                               </div>
                             )}
                             {parsed.corrections && parsed.corrections.length > 0 && (
                               <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-lg">
                                 <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"/> Исправления:</strong>
                                 <ul className="list-disc pl-4 mt-2 space-y-1">
                                   {parsed.corrections.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                                 </ul>
                               </div>
                             )}
                           </div>
                           <div className="h-px bg-border my-2 w-full"></div>
                           <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                             {parsed.final_answer}
                           </div>
                         </div>
                       ) : (
                         <div className="whitespace-pre-wrap leading-relaxed">
                           {m.content}
                         </div>
                       )}
                       
                       <div className="mt-4 pt-3 border-t border-border flex items-center relative z-10">
                         {i === activeSession.analyst.filter(m => m.role !== 'user').length - 1 && parsed?.divergences && parsed.divergences.length > 0 && (
                           <button onClick={() => handleDebate(parsed.divergences)} disabled={loadingPhase !== "idle"} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/30 rounded-lg transition font-medium shadow-sm mr-auto disabled:opacity-50 disabled:cursor-not-allowed">
                             ⚔️ Начать Дебаты
                           </button>
                         )}
                         <div className="flex gap-2 ml-auto">
                           <button onClick={() => copyToClipboard(textToPlay)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition border border-transparent hover:border-border">
                             <Copy className="w-3.5 h-3.5" /> Копировать
                           </button>
                           <button onClick={() => downloadText(textToPlay, activeSession?.title || "analysis")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition border border-transparent hover:border-border">
                             <Download className="w-3.5 h-3.5" /> Скачать .md
                           </button>
                         </div>
                       </div>
                       
                       <button 
                         onClick={() => playAudio(textToPlay, lang, msgId)}
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
          attachmentName={attachmentName} isUploadingAttachment={isUploadingAttachment}
          handleFileUpload={handleFileUpload} removeAttachment={removeAttachment}
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
                 
                 let contentToRender = m.content;
                 let textToPlay = m.content;
                 
                 if (expandedView.wKey === 'analyst') {
                   const parsed = parseAnalystResponse(m.content);
                   if (parsed) {
                     textToPlay = parsed.final_answer;
                     contentToRender = (
                       <div className="flex flex-col gap-4">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                             {parsed.agreements && parsed.agreements.length > 0 && (
                               <div className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 p-3 rounded-lg">
                                 <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"/> Согласие:</strong>
                                 <ul className="list-disc pl-4 mt-2 space-y-1">
                                   {parsed.agreements.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                                 </ul>
                               </div>
                             )}
                             {parsed.divergences && parsed.divergences.length > 0 && (
                               <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 p-3 rounded-lg">
                                 <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"/> Расхождения:</strong>
                                 <ul className="list-disc pl-4 mt-2 space-y-1">
                                   {parsed.divergences.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                                 </ul>
                               </div>
                             )}
                             {parsed.corrections && parsed.corrections.length > 0 && (
                               <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-lg">
                                 <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"/> Исправления:</strong>
                                 <ul className="list-disc pl-4 mt-2 space-y-1">
                                   {parsed.corrections.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                                 </ul>
                               </div>
                             )}
                           </div>
                           <div className="h-px bg-border my-2 w-full"></div>
                           <div className="whitespace-pre-wrap leading-relaxed text-base md:text-lg">
                             {parsed.final_answer}
                           </div>
                       </div>
                     ) as any;
                   }
                 }

                 return (
                   <div key={i} className="p-6 pr-16 rounded-xl bg-background border border-border shadow-sm relative whitespace-pre-wrap leading-relaxed">
                     {contentToRender}
                     
                     {expandedView.wKey === 'analyst' && (
                       <div className="mt-6 pt-4 border-t border-border flex items-center">
                         {i === expandedView.messages.filter(m => m.role !== 'user').length - 1 && parseAnalystResponse(m.content)?.divergences && parseAnalystResponse(m.content)!.divergences.length > 0 && (
                           <button onClick={() => { setExpandedView(null); handleDebate(parseAnalystResponse(m.content)!.divergences); }} disabled={loadingPhase !== "idle"} className="flex items-center gap-2 px-5 py-2.5 text-sm bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/30 rounded-lg transition font-bold shadow-sm mr-auto disabled:opacity-50 disabled:cursor-not-allowed">
                             ⚔️ Начать Дебаты
                           </button>
                         )}
                         <div className="flex gap-3 ml-auto">
                           <button onClick={() => copyToClipboard(textToPlay)} className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition border border-transparent hover:border-border shadow-sm">
                             <Copy className="w-4 h-4" /> Копировать
                           </button>
                           <button onClick={() => downloadText(textToPlay, activeSession?.title || "analysis")} className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition border border-transparent hover:border-border shadow-sm">
                             <Download className="w-4 h-4" /> Скачать .md
                           </button>
                         </div>
                       </div>
                     )}

                     <button 
                        onClick={() => playAudio(textToPlay, lang, msgId)}
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
