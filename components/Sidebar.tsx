import { T, Lang } from "@/lib/i18n";
import { Settings, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Sidebar({ 
  lang, setLang, sidebarOpen, sessions, activeId, setActiveId, setInput
}: any) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <aside className={`transition-all duration-300 glass-panel border-l-0 border-y-0 rounded-none flex flex-col z-20 overflow-hidden ${sidebarOpen ? 'w-72 border-r opacity-100' : 'w-0 border-r-0 opacity-0'}`}>
      <div className="p-4 flex-1 flex flex-col overflow-hidden w-72">
        <button 
          onClick={() => { setActiveId(null); setInput(""); }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary/80 to-purple-500/80 hover:from-primary hover:to-purple-500 font-bold mb-6 text-white shadow-[0_0_15px_rgba(168,139,255,0.3)] transition"
        >
          + {T[lang].new_chat}
        </button>

        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{T[lang].history}</div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {Object.values(sessions).length === 0 && <div className="text-sm text-muted-foreground">{T[lang].no_history}</div>}
          {Object.values(sessions).reverse().map((s: any) => (
            <button 
              key={s.id} 
              onClick={() => setActiveId(s.id)}
              className={`w-full text-left p-3 rounded-lg text-sm truncate transition ${activeId === s.id ? 'bg-muted border border-border text-foreground' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}
            >
              {s.title}
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t flex flex-col gap-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as Lang)}
                className="bg-transparent border-none outline-none cursor-pointer text-foreground"
              >
                <option value="ru" className="bg-background">🇷🇺 RU</option>
                <option value="en" className="bg-background">🇬🇧 EN</option>
                <option value="es" className="bg-background">🇪🇸 ES</option>
              </select>
            </div>
            
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-muted transition text-foreground"
                title="Переключить тему"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
