import { T, Lang } from "@/lib/i18n";
import { Settings } from "lucide-react";

export function Sidebar({ 
  lang, setLang, sidebarOpen, sessions, activeId, setActiveId, setInput
}: any) {
  return (
    <aside className={`transition-all duration-300 glass-panel border-l-0 border-y-0 rounded-none flex flex-col z-20 overflow-hidden ${sidebarOpen ? 'w-72 border-r border-white/10 opacity-100' : 'w-0 border-r-0 opacity-0'}`}>
      <div className="p-4 flex-1 flex flex-col overflow-hidden w-72">
        <button 
          onClick={() => { setActiveId(null); setInput(""); }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary/80 to-purple-500/80 hover:from-primary hover:to-purple-500 font-bold mb-6 shadow-[0_0_15px_rgba(168,139,255,0.3)] transition"
        >
          + {T[lang].new_chat}
        </button>

        <div className="text-xs uppercase tracking-widest text-white/50 mb-4">{T[lang].history}</div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {Object.values(sessions).length === 0 && <div className="text-sm text-white/40">{T[lang].no_history}</div>}
          {Object.values(sessions).reverse().map((s: any) => (
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
  );
}
