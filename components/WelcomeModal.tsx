import { T, Lang } from "@/lib/i18n";

export function WelcomeModal({ lang, setLang, setWelcomeSeen }: { lang: Lang, setLang: (l: Lang) => void, setWelcomeSeen: (b: boolean) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel p-8 max-w-2xl w-full mx-4 text-center flex flex-col items-center">
        <img src="/logo.png" alt="Logo" className="h-16 w-auto mb-2 object-contain drop-shadow-[0_0_20px_rgba(168,139,255,0.8)]" />
        <h1 className="text-4xl font-bold neon-text mb-6">Bottleneck</h1>
        
        <div className="flex gap-4 justify-center mb-8">
          <button onClick={() => setLang("ru")} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">🇷🇺 Русский</button>
          <button onClick={() => setLang("en")} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">🇬🇧 English</button>
          <button onClick={() => setLang("es")} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">🇪🇸 Español</button>
        </div>

        <div className="text-left text-white/80 whitespace-pre-wrap leading-relaxed bg-black/20 p-6 rounded-xl mb-8 border border-white/5">
          {T[lang].welcomeText}
        </div>

        <button onClick={() => setWelcomeSeen(true)} className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 font-bold text-lg shadow-[0_0_20px_rgba(168,139,255,0.4)] transition-all hover:scale-[1.02]">
          {T[lang].start}
        </button>
      </div>
    </div>
  );
}
