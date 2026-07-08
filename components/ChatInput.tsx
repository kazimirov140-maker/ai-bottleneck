import { T, Lang } from "@/lib/i18n";
import { Play, Mic, MicOff, Paperclip, X, Loader2 } from "lucide-react";

export function ChatInput({ 
  lang, input, setInput, isRecording, toggleVoice, handleSend, loadingPhase,
  attachmentName, isUploadingAttachment, handleFileUpload, removeAttachment
}: any) {
  return (
    <div className="flex-1 w-full max-w-[800px] relative">
      
      {attachmentName && (
        <div className="absolute -top-12 left-4 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 z-10">
           <Paperclip className="w-3.5 h-3.5" />
           <span className="truncate max-w-[200px] font-medium">{attachmentName}</span>
           <button onClick={removeAttachment} className="hover:text-destructive hover:bg-destructive/10 p-0.5 rounded-full transition ml-1">
             <X className="w-3.5 h-3.5" />
           </button>
        </div>
      )}

      <div className="glass-panel p-1.5 pl-2 flex items-center gap-2 border border-border/50 shadow-sm rounded-xl bg-background/60 focus-within:border-primary/50 transition-colors">
        
        <input type="file" id="file-upload" className="hidden" accept=".pdf,.txt,.md,.csv" onChange={handleFileUpload} />
        
        <button 
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isUploadingAttachment || loadingPhase !== "idle"}
          className={`p-2 transition rounded-lg ${isUploadingAttachment ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-muted disabled:opacity-50'}`}
          title={T[lang].attachFile}
        >
          {isUploadingAttachment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </button>

        <textarea 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={T[lang].chat_input}
          className="flex-1 bg-transparent border-none outline-none resize-none min-h-[40px] max-h-[120px] py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
          rows={Math.min(3, input.split('\n').length)}
        />

        <button 
          onClick={toggleVoice} 
          className={`p-2.5 transition rounded-lg ${isRecording ? 'bg-destructive/20 text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary hover:bg-muted'}`}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button 
          onClick={handleSend}
          disabled={loadingPhase !== "idle" || !input.trim()}
          className="p-2.5 bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </button>

      </div>
    </div>
  );
}
