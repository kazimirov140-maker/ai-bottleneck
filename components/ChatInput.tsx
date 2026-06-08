import { T, Lang } from "@/lib/i18n";
import { Play, Mic, MicOff } from "lucide-react";

export function ChatInput({ 
  lang, input, setInput, isRecording, toggleVoice, handleSend, loadingPhase 
}: any) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none transition-colors duration-500">
      <div className="max-w-[1200px] mx-auto relative pointer-events-auto">
        <div className="glass-panel p-2 pl-4 flex items-end gap-2 border border-border shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          
          <textarea 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={T[lang].chat_input}
            className="flex-1 bg-transparent border-none outline-none resize-none min-h-[50px] max-h-[200px] py-3 text-foreground placeholder:text-muted-foreground"
            rows={Math.min(5, input.split('\n').length)}
          />

          <button 
            onClick={toggleVoice} 
            className={`p-3 transition rounded-xl mr-1 ${isRecording ? 'bg-destructive/20 text-destructive animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button 
            onClick={handleSend}
            disabled={loadingPhase !== "idle" || !input.trim()}
            className="p-3 bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white rounded-xl transition shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>

        </div>
        <div className="text-center mt-2 text-[10px] text-muted-foreground/60 uppercase tracking-widest">
          © 2026 AI Bottleneck.
        </div>
      </div>
    </div>
  );
}
