import { T, Lang } from "@/lib/i18n";

export function WelcomeModal({ lang, setLang, setWelcomeSeen }: { lang: Lang, setLang: (l: Lang) => void, setWelcomeSeen: (b: boolean) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md overflow-y-auto p-4 transition-colors duration-500">
      <div className="glass-panel p-4 max-w-[95%] lg:max-w-6xl w-full text-center flex flex-col items-center my-auto">
        <img src="/logo.png" alt="Logo" className="h-20 lg:h-24 w-auto mb-6 object-contain drop-shadow-[0_0_20px_rgba(168,139,255,0.8)]" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-2 w-full text-left">
          {/* Russian */}
          <div className="bg-muted/30 p-4 rounded-xl border border-border flex flex-col h-full hover:bg-muted/50 transition-colors">
            <h3 className="text-lg font-bold mb-2 text-foreground">🇷🇺 Русский</h3>
            <div className="text-muted-foreground whitespace-pre-wrap leading-tight flex-1 text-xs">
              {T.ru.welcomeText}
            </div>
            <button onClick={() => { setLang("ru"); setWelcomeSeen(true); }} className="mt-4 w-full py-2 rounded-xl bg-primary hover:bg-primary/90 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] text-sm">
              {T.ru.start}
            </button>
          </div>

          {/* English */}
          <div className="bg-muted/30 p-4 rounded-xl border border-border flex flex-col h-full hover:bg-muted/50 transition-colors">
            <h3 className="text-lg font-bold mb-2 text-foreground">🇬🇧 English</h3>
            <div className="text-muted-foreground whitespace-pre-wrap leading-tight flex-1 text-xs">
              {T.en.welcomeText}
            </div>
            <button onClick={() => { setLang("en"); setWelcomeSeen(true); }} className="mt-4 w-full py-2 rounded-xl bg-primary hover:bg-primary/90 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] text-sm">
              {T.en.start}
            </button>
          </div>

          {/* Spanish */}
          <div className="bg-muted/30 p-4 rounded-xl border border-border flex flex-col h-full hover:bg-muted/50 transition-colors">
            <h3 className="text-lg font-bold mb-2 text-foreground">🇪🇸 Español</h3>
            <div className="text-muted-foreground whitespace-pre-wrap leading-tight flex-1 text-xs">
              {T.es.welcomeText}
            </div>
            <button onClick={() => { setLang("es"); setWelcomeSeen(true); }} className="mt-4 w-full py-2 rounded-xl bg-primary hover:bg-primary/90 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] text-sm">
              {T.es.start}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
