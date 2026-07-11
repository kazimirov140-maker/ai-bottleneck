import React, { RefObject } from "react";
import { T, Lang } from "@/lib/i18n";
import { Copy, Download, Expand, Loader2, Square, Volume2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface AnalystWindowProps {
  activeSession: any;
  lang: Lang;
  models: any;
  setModels: any;
  failedModels: string[];
  analystModelsArray: any[];
  analystPrompt: string;
  setAnalystPrompt: (prompt: string) => void;
  handleDebate: (divergences: string[]) => void;
  loadingPhase: string;
  messagesEndRef: RefObject<HTMLDivElement>;
  setExpandedView: (view: any) => void;
  playAudio: (text: string, lang: string, msgId: string) => void;
  playingAudioId: string | null;
  audioLoadingId: string | null;
  copyToClipboard: (text: string) => void;
  downloadText: (text: string, title: string) => void;
}

export function AnalystWindow({
  activeSession, lang, models, setModels, failedModels, analystModelsArray,
  analystPrompt, setAnalystPrompt, handleDebate, loadingPhase, messagesEndRef,
  setExpandedView, playAudio, playingAudioId, audioLoadingId, copyToClipboard, downloadText
}: AnalystWindowProps) {
  
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

  const getHallucinationCount = () => {
    if (!activeSession) return 0;
    let count = 0;
    activeSession.analyst.forEach((m: any) => {
      if (m.role === 'assistant') {
        const parsed = parseAnalystResponse(m.content);
        if (parsed && parsed.corrections) {
          count += parsed.corrections.length;
        }
      }
    });
    return count;
  };

  const activeModels = analystModelsArray.filter(m => !failedModels.includes(m.id));

  return (
    <div className="glass-panel p-6 border-[2px] border-primary/50 shadow-[0_0_30px_rgba(168,139,255,0.15)] relative overflow-hidden transition-all">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 pointer-events-none" />
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(168,139,255,0.8)] animate-pulse" />
            {T[lang].finalTitle}
          </h3>
          {activeSession && getHallucinationCount() > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold shadow-sm animate-in fade-in zoom-in" title={T[lang].analystCorrections}>
              🚨 {T[lang].hallucinations}: {getHallucinationCount()}
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
        onChange={(e) => setModels((m: any) => ({ ...m, analyst: activeModels.find(x => x.id === e.target.value)! }))}
        className="w-full lg:w-1/3 bg-background border border-primary/30 rounded-lg p-2 text-sm text-primary mb-4 focus:outline-none focus:border-primary relative z-10"
      >
        {activeModels.map(m => <option key={m.id} value={m.id} className="bg-slate-900 text-white">{m.label}</option>)}
      </select>

      <textarea 
        value={analystPrompt}
        onChange={(e) => setAnalystPrompt(e.target.value)}
        rows={12}
        className="w-full bg-background border border-primary/20 rounded-lg p-3 text-sm text-muted-foreground mb-4 focus:outline-none focus:border-primary min-h-[200px] relative z-10 resize-y"
        placeholder="Системный промпт Аналитика..."
      />

      <div className="min-h-[200px] max-h-[600px] overflow-y-auto p-4 bg-muted/50 rounded-xl border border-primary/10 text-foreground relative z-10">
        {(!activeSession || activeSession.analyst.length === 0) && <div className="text-muted-foreground italic">{T[lang].analyst_waiting}</div>}
        {activeSession && activeSession.analyst.filter((m: any) => m.role !== 'user').map((m: any, i: number) => {
            const msgId = `analyst-${i}`;
            const isPlaying = playingAudioId === msgId;
            const isLoading = audioLoadingId === msgId;
            const parsed = parseAnalystResponse(m.content);
            const textToPlay = parsed ? parsed.final_answer : m.content;
            
            return (
              <div key={i} className="p-4 pr-12 mb-4 rounded-xl bg-background border border-primary/20 mr-2 shadow-sm relative">
                {parsed ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {parsed.agreements && parsed.agreements.length > 0 && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 p-3 rounded-lg">
                          <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"/> {T[lang].agreements}:</strong>
                          <ul className="list-disc pl-4 mt-2 space-y-1">
                            {parsed.agreements.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                          </ul>
                        </div>
                      )}
                      {parsed.divergences && parsed.divergences.length > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 p-3 rounded-lg">
                          <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"/> {T[lang].divergences}:</strong>
                          <ul className="list-disc pl-4 mt-2 space-y-1">
                            {parsed.divergences.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                          </ul>
                        </div>
                      )}
                      {parsed.corrections && parsed.corrections.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-lg">
                          <strong className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"/> {T[lang].corrections}:</strong>
                          <ul className="list-disc pl-4 mt-2 space-y-1">
                            {parsed.corrections.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="h-px bg-border my-2 w-full"></div>
                    <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                      <MarkdownRenderer content={parsed.final_answer} />
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    <MarkdownRenderer content={m.content} />
                  </div>
                )}
                
                <div className="mt-4 pt-3 border-t border-border flex items-center relative z-10">
                  {i === activeSession.analyst.filter((mx: any) => mx.role !== 'user').length - 1 && parsed?.divergences && parsed.divergences.length > 0 && (
                    <button onClick={() => handleDebate(parsed.divergences)} disabled={loadingPhase !== "idle"} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/30 rounded-lg transition font-medium shadow-sm mr-auto disabled:opacity-50 disabled:cursor-not-allowed">
                      ⚔️ {T[lang].startDebate}
                    </button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => copyToClipboard(textToPlay)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition border border-transparent hover:border-border">
                      <Copy className="w-3.5 h-3.5" /> {T[lang].copy}
                    </button>
                    <button onClick={() => downloadText(textToPlay, activeSession?.title || "analysis")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition border border-transparent hover:border-border">
                      <Download className="w-3.5 h-3.5" /> {T[lang].downloadMd}
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => playAudio(textToPlay, lang, msgId)}
                  className={`absolute right-3 top-3 p-2 rounded-xl transition-all shadow-sm ${isPlaying || isLoading ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-muted border border-primary/10'}`}
                  title={isPlaying ? T[lang].stop : T[lang].listen}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Volume2 className="w-5 h-5" />)}
                </button>
              </div>
            );
        })}
        {loadingPhase === "analyst" && <div className="text-primary animate-pulse">{T[lang].analyzing}</div>}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
