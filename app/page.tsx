"use client";

import { useState, useEffect, useRef } from "react";
import { T, WIN1_MODELS, WIN2_MODELS, WIN3_MODELS, Lang } from "@/lib/i18n";
import { Menu, PanelLeftClose, X, Loader2 } from "lucide-react";
import { WelcomeModal } from "@/components/WelcomeModal";
import { Sidebar } from "@/components/Sidebar";
import { ChatInput } from "@/components/ChatInput";
import { useChatSession } from "@/hooks/useChatSession";
import { useAudio } from "@/hooks/useAudio";
import { WorkerWindow } from "@/components/WorkerWindow";
import { AnalystWindow } from "@/components/AnalystWindow";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function Home() {
  const [lang, setLang] = useState<Lang>("ru");
  const [welcomeSeen, setWelcomeSeen] = useState(false);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const recognitionRef = useRef<any>(null);
  const [expandedView, setExpandedView] = useState<{title: string, messages: any[], wKey: string} | null>(null);

  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentText, setAttachmentText] = useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const {
    sessions, setSessions, activeId, setActiveId, activeSession,
    loadingPhase, setLoadingPhase, failedModels, setFailedModels,
    isLoaded, models, setModels
  } = useChatSession(lang);

  const { playingAudioId, audioLoadingId, playAudio } = useAudio();

  const [analystPrompt, setAnalystPrompt] = useState(T[lang].defaultAnalystPrompt);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const win1Ref = useRef<HTMLDivElement>(null);
  const win2Ref = useRef<HTMLDivElement>(null);
  const win3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedWelcome = localStorage.getItem("bottleneck_welcomeSeen");
      if (savedWelcome) setWelcomeSeen(savedWelcome === "true");
      const savedLang = localStorage.getItem("bottleneck_lang");
      if (savedLang) setLang(savedLang as Lang);
    } catch(e) {}
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("bottleneck_welcomeSeen", welcomeSeen.toString());
    localStorage.setItem("bottleneck_lang", lang);
  }, [welcomeSeen, lang, isLoaded]);

  useEffect(() => {
    const isDefault = Object.values(T).some(t => t.defaultAnalystPrompt === analystPrompt);
    if (isDefault) setAnalystPrompt(T[lang].defaultAnalystPrompt);
    
    if (activeSession) {
      const isSessionDefault = Object.values(T).some(t => t.defaultAnalystPrompt === activeSession.analystPrompt);
      if (isSessionDefault) {
        setSessions(prev => ({
          ...prev,
          [activeSession.id]: { ...activeSession, analystPrompt: T[lang].defaultAnalystPrompt }
        }));
      }
    }
  }, [lang, activeSession?.id]);

  useEffect(() => {
    if (loadingPhase === "idle") {
       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
       win1Ref.current?.scrollIntoView({ behavior: "smooth" });
       win2Ref.current?.scrollIntoView({ behavior: "smooth" });
       win3Ref.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessions, activeId, loadingPhase]);

  const handleSend = async () => {
    if ((!input.trim() && !attachmentText) || loadingPhase !== "idle") return;

    let userMsg = input.trim();
    if (attachmentText) {
      userMsg += `\n\n--- ${T[lang].attachedFile}: ${attachmentName} ---\n${attachmentText}`;
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
          lang,
          messages: {
            win1: [...currentSession.win1, { role: "user", content: userMsg }],
            win2: [...currentSession.win2, { role: "user", content: userMsg }],
            win3: [...currentSession.win3, { role: "user", content: userMsg }]
          }
        })
      });
      const wData = await workersRes.json();
      
      if (wData.failedModels && wData.failedModels.length > 0) {
        setFailedModels(prev => Array.from(new Set([...prev, ...wData.failedModels])));
      }
      
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
          lang,
          analystPrompt: currentSession.analystPrompt,
          messages: [...currentSession.analyst, { role: "user", content: userMsg }],
          workerAnswers: [wData.ans1, wData.ans2, wData.ans3]
        })
      });
      const aData = await analystRes.json();
      
      if (aData.failedModels && aData.failedModels.length > 0) {
        setFailedModels(prev => Array.from(new Set([...prev, ...aData.failedModels])));
      }
      
      currentSession.analyst.push({ role: "user", content: userMsg }, { role: "assistant", content: aData.ansAnalyst });
      setSessions(prev => ({ ...prev, [currentSession!.id]: currentSession! }));
    } catch (err) {
      console.error(err);
      alert("Error generating response.");
    } finally {
      setLoadingPhase("idle");
    }
  };

  const handleDebate = async (divergences: string[]) => {
    if (loadingPhase !== "idle" || !activeSession) return;
    
    const debateMsg = T[lang].autoDebateWarning.replace('{divergences}', divergences.map(d => "- " + d).join('\n'));
    
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
          lang,
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
          lang,
          analystPrompt: currentSession.analystPrompt,
          messages: [...currentSession.analyst, { role: "user", content: debateMsg }],
          workerAnswers: [wData.ans1, wData.ans2, wData.ans3]
        })
      });
      const aData = await analystRes.json();
      
      currentSession.analyst.push({ role: "user", content: debateMsg }, { role: "assistant", content: aData.ansAnalyst });
      setSessions(prev => ({ ...prev, [currentSession.id]: currentSession }));
      
    } catch (err) {
      console.error(err);
      alert("Error generating debate response.");
    } finally {
      setLoadingPhase("idle");
    }
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
        alert(T[lang].readError + (data.error || "Error"));
        setAttachmentName(null);
      }
    } catch (err) {
      console.error(err);
      alert(T[lang].networkError);
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

  const toggleVoice = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(T[lang].browserVoiceError);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
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
        setInput(prev => prev + (prev.endsWith(' ') ? '' : ' ') + finalTranscript.trim() + ' ');
      }
    };
    recognition.onerror = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    
    recognition.start();
  };

  const parseAnalystResponse = (content: string) => {
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.final_answer) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  };

  if (!isLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

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
        <header className="p-3 lg:p-4 flex flex-col md:flex-row justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-40 border-b border-border shadow-sm gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto shrink-0 justify-between md:justify-start">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 glass-panel rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground flex items-center justify-center"
              title={sidebarOpen ? T[lang].hidePanel : T[lang].showPanel}
            >
              {sidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo" className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            </div>
          </div>
          <ChatInput 
            lang={lang} input={input} setInput={setInput} 
            isRecording={isRecording} toggleVoice={toggleVoice} 
            handleSend={handleSend} loadingPhase={loadingPhase} 
            attachmentName={attachmentName} isUploadingAttachment={isUploadingAttachment}
            handleFileUpload={handleFileUpload} removeAttachment={removeAttachment}
          />
        </header>

        <div className="flex-1 overflow-y-auto pb-8 px-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {activeSession && activeSession.messages.length > 0 && (
              <div className="glass-panel p-4 rounded-xl border border-primary/20">
                <div className="text-xs uppercase tracking-widest text-primary mb-2">{T[lang].prompt}</div>
                <div className="text-foreground">{activeSession.messages[activeSession.messages.length-1].content}</div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((num) => {
                const wKey = `win${num}` as "win1" | "win2" | "win3";
                const history = activeSession ? activeSession[wKey] : [];
                const winModelsArray = num === 1 ? WIN1_MODELS : num === 2 ? WIN2_MODELS : WIN3_MODELS;
                const winRef = num === 1 ? win1Ref : num === 2 ? win2Ref : win3Ref;
                
                return (
                  <WorkerWindow
                    key={num} num={num} history={history} lang={lang} wKey={wKey}
                    models={models} setModels={setModels} failedModels={failedModels}
                    winModelsArray={winModelsArray} loadingPhase={loadingPhase}
                    winRef={winRef} setExpandedView={setExpandedView}
                    playAudio={playAudio} playingAudioId={playingAudioId} audioLoadingId={audioLoadingId}
                  />
                );
              })}
            </div>

            <AnalystWindow 
              activeSession={activeSession} lang={lang} models={models} setModels={setModels}
              failedModels={failedModels} analystModelsArray={require('@/lib/i18n').ANALYST_MODELS}
              analystPrompt={analystPrompt} setAnalystPrompt={setAnalystPrompt}
              handleDebate={handleDebate} loadingPhase={loadingPhase} messagesEndRef={messagesEndRef}
              setExpandedView={setExpandedView} playAudio={playAudio} playingAudioId={playingAudioId}
              audioLoadingId={audioLoadingId} copyToClipboard={copyToClipboard} downloadText={downloadText}
            />
          </div>
        </div>
      </main>

      {expandedView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-all duration-300">
          <div className="glass-panel p-6 w-full max-w-5xl h-[85vh] flex flex-col relative border border-primary/30 shadow-[0_0_40px_rgba(59,130,246,0.15)] animate-in zoom-in-95">
            <button onClick={() => setExpandedView(null)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted text-muted-foreground transition"><X className="w-6 h-6"/></button>
            <h2 className="text-2xl font-semibold tracking-tight mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
              {expandedView.title}
            </h2>
            <div className="flex-1 overflow-y-auto pr-4 space-y-6 text-lg text-foreground/90">
               {expandedView.messages.length === 0 && <div className="text-muted-foreground italic">{T[lang].waiting}</div>}
               {expandedView.messages.filter(m => m.role !== 'user').map((m, i) => {
                 let contentToRender = <MarkdownRenderer content={m.content} />;
                 let textToPlay = m.content;
                 
                 if (expandedView.wKey === 'analyst') {
                   const parsed = parseAnalystResponse(m.content);
                   if (parsed) {
                     textToPlay = parsed.final_answer;
                     contentToRender = (
                       <div className="flex flex-col gap-4">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                             {parsed.agreements && parsed.agreements.length > 0 && (
                               <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg">
                                 <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"/> {T[lang].agreements}:</strong>
                                 <ul className="list-disc pl-4 mt-2 space-y-1">
                                   {parsed.agreements.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                                 </ul>
                               </div>
                             )}
                             {parsed.divergences && parsed.divergences.length > 0 && (
                               <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg">
                                 <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full"/> {T[lang].divergences}:</strong>
                                 <ul className="list-disc pl-4 mt-2 space-y-1">
                                   {parsed.divergences.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                                 </ul>
                               </div>
                             )}
                             {parsed.corrections && parsed.corrections.length > 0 && (
                               <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg">
                                 <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-full"/> {T[lang].corrections}:</strong>
                                 <ul className="list-disc pl-4 mt-2 space-y-1">
                                   {parsed.corrections.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                                 </ul>
                               </div>
                             )}
                           </div>
                           <div className="h-px bg-border my-2 w-full"></div>
                           <div className="whitespace-pre-wrap leading-relaxed text-base md:text-lg">
                             <MarkdownRenderer content={parsed.final_answer} />
                           </div>
                       </div>
                     ) as any;
                   }
                 }

                 return (
                   <div key={i} className="p-6 rounded-xl bg-background border border-border shadow-sm relative whitespace-pre-wrap leading-relaxed">
                     {contentToRender}
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
