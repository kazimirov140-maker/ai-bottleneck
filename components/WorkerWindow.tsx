import React, { RefObject } from "react";
import { T, Lang } from "@/lib/i18n";
import { Expand, Loader2, Square, Volume2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface WorkerWindowProps {
  num: number;
  history: any[];
  lang: Lang;
  wKey: "win1" | "win2" | "win3";
  models: any;
  setModels: any;
  failedModels: string[];
  winModelsArray: any[];
  loadingPhase: string;
  winRef: RefObject<HTMLDivElement>;
  setExpandedView: (view: any) => void;
  playAudio: (text: string, lang: string, msgId: string) => void;
  playingAudioId: string | null;
  audioLoadingId: string | null;
}

export function WorkerWindow({
  num, history, lang, wKey, models, setModels, failedModels, 
  winModelsArray, loadingPhase, winRef, setExpandedView, 
  playAudio, playingAudioId, audioLoadingId
}: WorkerWindowProps) {
  const activeModels = winModelsArray.filter(m => !failedModels.includes(m.id));

  return (
    <div className="glass-panel p-5 flex flex-col h-[500px]">
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
        onChange={(e) => setModels((m: any) => ({ ...m, [wKey]: activeModels.find(x => x.id === e.target.value)! }))}
        className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground mb-4 focus:outline-none focus:border-primary"
      >
        {activeModels.map(m => <option key={m.id} value={m.id} className="bg-slate-900 text-white">{m.label}</option>)}
      </select>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-sm text-foreground/90">
        {history.length === 0 && <div className="text-muted-foreground italic">{T[lang].waiting}</div>}
        {history.filter(m => m.role !== 'user').map((m, i) => {
          const msgId = `${wKey}-${i}`;
          const isPlaying = playingAudioId === msgId;
          const isLoading = audioLoadingId === msgId;
          return (
            <div key={i} className="p-3 pr-10 rounded-lg bg-muted mr-2 border border-border relative">
              <MarkdownRenderer content={m.content} />
              <button 
                onClick={() => playAudio(m.content, lang, msgId)}
                className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${isPlaying || isLoading ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-background'}`}
                title={isPlaying ? T[lang].stop : T[lang].listen}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />)}
              </button>
            </div>
          );
        })}
        {loadingPhase === "workers" && <div className="text-primary animate-pulse text-sm">{T[lang].generating}</div>}
        <div ref={winRef} />
      </div>
    </div>
  );
}
