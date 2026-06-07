import { T, Lang } from "@/lib/i18n";

export function WelcomeModal({ lang, setLang, setWelcomeSeen }: { lang: Lang, setLang: (l: Lang) => void, setWelcomeSeen: (b: boolean) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto p-4">
      <div className="glass-panel p-4 max-w-[95%] lg:max-w-6xl w-full text-center flex flex-col items-center my-auto">
        <img src="/logo.png" alt="Logo" className="h-12 w-auto mb-2 object-contain drop-shadow-[0_0_20px_rgba(168,139,255,0.8)]" />
        <h1 className="text-2xl font-bold neon-text mb-4">Bottleneck</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-2 w-full text-left">
          {/* Russian */}
          <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col h-full">
            <h3 className="text-lg font-bold mb-2 text-white/90">🇷🇺 Русский</h3>
            <div className="text-white/80 whitespace-pre-wrap leading-tight flex-1 text-xs">
              {T.ru.welcomeText}
            </div>
            <button onClick={() => { setLang("ru"); setWelcomeSeen(true); }} className="mt-4 w-full py-2 rounded-xl bg-primary hover:bg-primary/90 font-bold text-white shadow-[0_0_15px_rgba(168,139,255,0.4)] transition-all hover:scale-[1.02] text-sm">
              {T.ru.start}
            </button>
          </div>

          {/* English */}
          <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col h-full">
            <h3 className="text-lg font-bold mb-2 text-white/90">🇬🇧 English</h3>
            <div className="text-white/80 whitespace-pre-wrap leading-tight flex-1 text-xs">
              {T.en.welcomeText}
            </div>
            <button onClick={() => { setLang("en"); setWelcomeSeen(true); }} className="mt-4 w-full py-2 rounded-xl bg-primary hover:bg-primary/90 font-bold text-white shadow-[0_0_15px_rgba(168,139,255,0.4)] transition-all hover:scale-[1.02] text-sm">
              {T.en.start}
            </button>
          </div>

          {/* Spanish */}
          <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col h-full">
            <h3 className="text-lg font-bold mb-2 text-white/90">🇪🇸 Español</h3>
            <div className="text-white/80 whitespace-pre-wrap leading-tight flex-1 text-xs">
              {T.es.welcomeText}
            </div>
            <button onClick={() => { setLang("es"); setWelcomeSeen(true); }} className="mt-4 w-full py-2 rounded-xl bg-primary hover:bg-primary/90 font-bold text-white shadow-[0_0_15px_rgba(168,139,255,0.4)] transition-all hover:scale-[1.02] text-sm">
              {T.es.start}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
