import streamlit as st
import os
import hashlib
from groq import Groq
from dotenv import load_dotenv
import concurrent.futures
from openai import OpenAI
import google.generativeai as genai
from datetime import datetime
# НАСТРОЙКА ПУТИ: Безопасный способ найти папку проекта, который работает и на сервере
# НАСТРОЙКА ПУТИ
current_dir = os.getcwd()
dotenv_path = os.path.join(current_dir, '.env')
load_dotenv(dotenv_path)
def get_api_key(env_var: str) -> str | None:
    """Safe retrieval of API keys from secrets or environment."""
    try:
        return st.secrets.get(env_var) or os.getenv(env_var)
    except Exception:
        return os.getenv(env_var)
GROQ_API_KEY = get_api_key("GROQ_API_KEY")
OPENROUTER_API_KEY = get_api_key("OPENROUTER_API_KEY")
GEMINI_API_KEY = get_api_key("GEMINI_API_KEY")
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
else:
    groq_client = None
if OPENROUTER_API_KEY:
    openrouter_client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENROUTER_API_KEY)
else:
    openrouter_client = None
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
openrouter_client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENROUTER_API_KEY) if OPENROUTER_API_KEY else None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
MODEL_REGISTRY = {
    "Gemini 2.0 Flash (Быстрая)": {"id": "gemini-2.0-flash", "provider": "gemini"},
    "Llama 3.3 70B (Универсальная)": {"id": "llama-3.3-70b-versatile", "provider": "groq"},
    "Llama 3.1 8B (Легкая)": {"id": "llama-3.1-8b-instant", "provider": "groq"},
    "DeepSeek R1 (Логика, Free)": {"id": "deepseek/deepseek-r1:free", "provider": "openrouter"},
    "Mistral Nemo (Креатив, Free)": {"id": "mistralai/mistral-nemo:free", "provider": "openrouter"},
}
FALLBACK_MODELS = {
    "gemini": "llama-3.1-8b-instant", # fallback to groq 8B
    "openrouter": "llama-3.3-70b-versatile" # fallback to groq 70B
    "gemini": "llama-3.1-8b-instant", 
    "openrouter": "llama-3.3-70b-versatile"
}
MODEL_OPTIONS = list(MODEL_REGISTRY.keys())
DEFAULT_WIN1 = "Llama 3.1 8B (Легкая)"
DEFAULT_WIN2 = "Mistral Nemo (Креатив, Free)"
DEFAULT_WIN3 = "DeepSeek R1 (Логика, Free)"
DEFAULT_JUDGE = "Gemini 2.0 Flash (Быстрая)"
MODEL_TRAITS = {
    "Gemini 2.0 Flash (Быстрая)": "✅ Отличный баланс скорости и качества от Google. ⚠️ Требует GEMINI_API_KEY.",
    "Llama 3.3 70B (Универсальная)": "✅ Llama 3.3 70B через Groq — сильный баланс качества и скорости.",
    "Llama 3.1 8B (Легкая)": "✅ Llama 3.1 8B через Groq — самая быстрая production-модель.",
    "DeepSeek R1 (Логика, Free)": "✅ Мощная рассуждающая модель (OpenRouter Free). ⚠️ Требует OPENROUTER_API_KEY.",
    "Mistral Nemo (Креатив, Free)": "✅ Креативная модель от Mistral (OpenRouter Free). ⚠️ Требует OPENROUTER_API_KEY.",
    "Gemini 2.0 Flash (Быстрая)": "⚡ Быстрая / Google",
    "Llama 3.3 70B (Универсальная)": "🧠 Мощная / Groq",
    "Llama 3.1 8B (Легкая)": "🚀 Легкая / Groq",
    "DeepSeek R1 (Логика, Free)": "🔍 Логика / OpenRouter",
    "Mistral Nemo (Креатив, Free)": "🎨 Креатив / OpenRouter",
}
MODEL_COL_HEIGHT = 480
JUDGE_COL_HEIGHT = 480
BRAND_NAME = "⚡ ai Bottleneck"
WAITING_MSG = "Ожидаю запрос..."
JUDGE_WAITING_MSG = "Ожидаю финальный сублимированный анализ..."
T = {
    "ru": {
        "window": "Окно",
        "finalTitle": "Финальный анализ и синтез (Судья)",
        "prompt": "ЗАПРОС",
        "welcomeText": "Этот сайт создан для того, чтобы вы могли получить максимально точный и правильный ответ на любой свой запрос, полностью защищённый от выдумок и галлюцинаций со стороны ИИ.",
        "start": "Начать работу",
        "waiting": "Ожидаю запрос...",
        "judge_waiting": "Ожидаю ответы окон для синтеза...",
        "new_chat": "🧹 Новый чат",
        "chat_input": "Введите ваш вопрос для всех нейросетей сразу...",
        "expand": "🔍 Расширить",
        "file_notice_title": "Демонстрационная версия",
        "file_notice_text": "Это демонстрационный прототип фронтенда. Вы можете прикрепить файл или аудио, но для генерации настоящих ответов не забудьте указать свои API ключи в .env",
        "got_it": "Понятно",
        "history": "История чатов",
        "no_history": "Нет сохраненных чатов",
        "settings": "Настройки",
        "language": "Язык",
        "attach": "📎 Прикрепить",
        "voice": "🎤 Голос",
    },
    "en": {
        "window": "Window",
        "finalTitle": "Final Analysis & Synthesis (Judge)",
        "prompt": "PROMPT",
        "welcomeText": "This site is designed to give you the most accurate and correct answer to any prompt, completely protected from AI hallucinations.",
        "start": "Get Started",
        "waiting": "Waiting for prompt...",
        "judge_waiting": "Waiting for windows to finish for synthesis...",
        "new_chat": "🧹 New Chat",
        "chat_input": "Enter your question for all neural networks...",
        "expand": "🔍 Expand",
        "file_notice_title": "Demo Version",
        "file_notice_text": "This is a frontend prototype. You can attach a file or audio, but you must provide your API keys in .env for real generations.",
        "got_it": "Got it",
        "history": "Chat History",
        "no_history": "No saved chats",
        "settings": "Settings",
        "language": "Language",
        "attach": "📎 Attach",
        "voice": "🎤 Voice",
    },
    "es": {
        "window": "Ventana",
        "finalTitle": "Análisis Final y Síntesis (Juez)",
        "prompt": "CONSULTA",
        "welcomeText": "Este sitio está diseñado para brindarle la respuesta más precisa y correcta a cualquier consulta, completamente protegida contra alucinaciones de IA.",
        "start": "Empezar",
        "waiting": "Esperando consulta...",
        "judge_waiting": "Esperando respuestas para la síntesis...",
        "new_chat": "🧹 Nuevo Chat",
        "chat_input": "Introduce tu pregunta para todas las redes neuronales...",
        "expand": "🔍 Expandir",
        "file_notice_title": "Versión de Demostración",
        "file_notice_text": "Este es un prototipo frontend. Puedes adjuntar un archivo o audio, pero debes proporcionar tus claves API en .env para generaciones reales.",
        "got_it": "Entendido",
        "history": "Historial de chat",
        "no_history": "No hay chats guardados",
        "settings": "Ajustes",
        "language": "Idioma",
        "attach": "📎 Adjuntar",
        "voice": "🎤 Voz",
    }
}
PRIMARY_TIMEOUT = 45.0
WHISPER_MODEL = "whisper-large-v3"
HAS_AUDIO_INPUT = hasattr(st, "audio_input")
st.set_page_config(page_title="AI Bottleneck — Многоканальный ИИ-Анализатор", page_icon="⚡", layout="wide", initial_sidebar_state="expanded")
def inject_custom_css():
    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    :root {
        --background: #272138;
        --foreground: #F8F8F9;
        --gradient-bg: radial-gradient(ellipse at 20% 0%, rgba(77,31,102,0.45), transparent 55%),
                       radial-gradient(ellipse at 80% 100%, rgba(31,35,102,0.4), transparent 55%),
                       radial-gradient(ellipse at 50% 50%, rgba(51,20,76,0.25), transparent 70%);
        --shadow-glass: 0 8px 32px 0 rgba(10,5,30,0.5);
        --gradient-neon: linear-gradient(135deg, #A88BFF, #D05CE3 55%, #8BFFF5);
    }
    
    .stApp {
        background-color: var(--background) !important;
        background-image: var(--gradient-bg) !important;
        background-attachment: fixed !important;
        color: var(--foreground) !important;
        font-family: 'Inter', sans-serif !important;
    }
    
    /* Сайдбар */
    [data-testid="stSidebar"] {
        background-color: rgba(30,20,50,0.6) !important;
        backdrop-filter: blur(15px) !important;
        border-right: 1px solid rgba(255,255,255,0.05) !important;
    }
    
    /* Стили панелей-стекла */
    [data-testid="stVerticalBlockBorderWrapper"], .glass-panel {
        background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)) !important;
        backdrop-filter: blur(18px) saturate(140%) !important;
        -webkit-backdrop-filter: blur(18px) saturate(140%) !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        box-shadow: var(--shadow-glass) !important;
        border-radius: 1rem !important;
    }
    
    section.main > div[data-testid="stVerticalBlock"] > div[data-testid="stHorizontalBlock"]:first-of-type
    div[data-testid="stVerticalBlockBorderWrapper"] {
        height: 480px !important;
        min-height: 480px !important;
        max-height: 480px !important;
        overflow-y: auto;
    }
    
    /* Neon Text */
    .neon-text {
        background: var(--gradient-neon);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        font-weight: 700;
        letter-spacing: -0.02em;
    }
    
    /* Скрываем стандартный логотип Streamlit */
    [data-testid="stLogo"] { visibility: hidden !important; }
    
    /* Input */
    div[data-testid="stChatInput"] {
        background-color: rgba(20,10,40,0.8) !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
        box-shadow: var(--shadow-glass) !important;
        border-radius: 1rem !important;
    }
    div[data-testid="stChatInput"] textarea {
        color: var(--foreground) !important;
    }
    
    /* Prompt Container */
    .prompt-container {
        padding: 1rem;
        border-radius: 1rem;
        margin-bottom: 1.5rem;
    }
    .prompt-label {
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: rgba(255,255,255,0.5);
        margin-bottom: 0.25rem;
    }
    .prompt-text {
        font-size: 0.95rem;
        color: rgba(255,255,255,0.9);
    }
    </style>
    """, unsafe_allow_html=True)
inject_custom_css()
def model_index(label: str) -> int:
    try:
        return MODEL_OPTIONS.index(label)
    except ValueError:
        return 0
    try: return MODEL_OPTIONS.index(label)
    except ValueError: return 0
def init_session():
    if "lang" not in st.session_state: st.session_state.lang = "en"
    if "welcome_seen" not in st.session_state: st.session_state.welcome_seen = False
    if "file_notice_seen" not in st.session_state: st.session_state.file_notice_seen = False
    if "sessions" not in st.session_state: st.session_state.sessions = {} # {id: {prompt, answers, final}}
    if "active_id" not in st.session_state: st.session_state.active_id = None
    
    for key in ("win1_text", "win2_text", "win3_text", "judge_text"):
        if key not in st.session_state: st.session_state[key] = ""
    for key in ("history_win1", "history_win2", "history_win3", "history_judge"):
        if key not in st.session_state: st.session_state[key] = []
    if "current_prompt" not in st.session_state: st.session_state.current_prompt = ""
init_session()
lng = st.session_state.lang
@st.dialog("Welcome to AI Bottleneck", width="large")
def show_welcome():
    st.markdown("<h2 class='neon-text' style='text-align:center;'>⚡ AI Bottleneck</h2>", unsafe_allow_html=True)
    st.markdown("<p style='text-align:center;'>Select your language / Выберите язык / Seleccione su idioma</p>", unsafe_allow_html=True)
    st.write("---")
    
    col1, col2, col3 = st.columns(3)
    if col1.button("🇬🇧 English", use_container_width=True):
        st.session_state.lang = "en"
        st.session_state.welcome_seen = True
        st.rerun()
    if col2.button("🇷🇺 Русский", use_container_width=True):
        st.session_state.lang = "ru"
        st.session_state.welcome_seen = True
        st.rerun()
    if col3.button("🇪🇸 Español", use_container_width=True):
        st.session_state.lang = "es"
        st.session_state.welcome_seen = True
        st.rerun()
@st.dialog("Внимание / Notice", width="small")
def show_file_notice():
    st.markdown(f"### {T[lng]['file_notice_title']}")
    st.markdown(T[lng]['file_notice_text'])
    if st.button(T[lng]['got_it'], use_container_width=True, type="primary"):
        st.session_state.file_notice_seen = True
        st.rerun()
@st.dialog("Полный текст / Full Text", width="large")
def expand_panel(title: str, content: str):
    st.subheader(title)
    st.markdown(content)
if not st.session_state.welcome_seen:
    show_welcome()
def ask_llm(model_label: str, prompt_or_messages, timeout: float = PRIMARY_TIMEOUT) -> str:
    cfg = MODEL_REGISTRY.get(model_label)
    if not cfg:
        return f"❌ Неизвестная модель: {model_label}"
    if not cfg: return f"❌ Unknown model: {model_label}"
    
    provider = cfg["provider"]
    model_id = cfg["id"]
    
    provider, model_id = cfg["provider"], cfg["id"]
    if provider == "gemini" and not GEMINI_API_KEY:
        provider = "groq"
        model_id = FALLBACK_MODELS["gemini"]
        provider, model_id = "groq", FALLBACK_MODELS["gemini"]
    elif provider == "openrouter" and not OPENROUTER_API_KEY:
        provider = "groq"
        model_id = FALLBACK_MODELS["openrouter"]
        provider, model_id = "groq", FALLBACK_MODELS["openrouter"]
        
    if provider == "groq" and not GROQ_API_KEY:
         return "❌ Ошибка: GROQ_API_KEY не задан. Невозможно использовать fallback."
         return "❌ Error: GROQ_API_KEY not set."
    if isinstance(prompt_or_messages, str):
        messages = [{"role": "user", "content": prompt_or_messages}]
    else:
        messages = prompt_or_messages
    messages = [{"role": "user", "content": prompt_or_messages}] if isinstance(prompt_or_messages, str) else prompt_or_messages
    try:
        if provider == "groq":
            response = groq_client.chat.completions.create(
                model=model_id,
                messages=messages,
                timeout=timeout,
            )
            return response.choices[0].message.content or "❌ Пустой ответ"
            
            res = groq_client.chat.completions.create(model=model_id, messages=messages, timeout=timeout)
            return res.choices[0].message.content or "❌ Empty"
        elif provider == "gemini":
            contents = []
            for m in messages:
                role = "user" if m["role"] == "user" else "model"
                contents.append({"role": role, "parts": [m["content"]]})
            model = genai.GenerativeModel(model_id)
            response = model.generate_content(contents)
            return response.text
            
            contents = [{"role": "user" if m["role"] == "user" else "model", "parts": [m["content"]]} for m in messages]
            return genai.GenerativeModel(model_id).generate_content(contents).text
        elif provider == "openrouter":
            response = openrouter_client.chat.completions.create(
                model=model_id,
                messages=messages,
                timeout=timeout,
            )
            return response.choices[0].message.content or "❌ Пустой ответ"
            
            res = openrouter_client.chat.completions.create(model=model_id, messages=messages, timeout=timeout)
            return res.choices[0].message.content or "❌ Empty"
    except Exception as exc:
        return f"❌ API ERROR [{model_id}]\nТип: {type(exc).__name__}\nСообщение: {exc}"
        return f"❌ API ERROR [{model_id}]\n{exc}"
def transcribe_audio(audio_blob: bytes) -> str:
    """Распознавание голоса через Groq Whisper."""
    if not groq_client: return "❌ Ошибка: нет GROQ_API_KEY для Whisper"
    result = groq_client.audio.transcriptions.create(
        file=("voice.wav", audio_blob),
        model=WHISPER_MODEL,
        language="ru",
    )
    text = getattr(result, "text", None)
    if text:
        return text.strip()
    return str(result).strip()
def run_query_pipeline(user_input: str, m1: str, m2: str, m3: str, mj: str, p1, p2, p3, pj):
    st.session_state.current_prompt = user_input
    
    p1.warning(f"⏳ {m1}...")
    p2.warning(f"⏳ {m2}...")
    p3.warning(f"⏳ {m3}...")
    pj.warning(f"⏳ {T[lng]['judge_waiting']}")
def handle_voice_input(audio_file) -> str | None:
    if audio_file is None:
        return None
    blob = audio_file.getvalue()
    if not blob:
        return None
    audio_hash = hashlib.md5(blob).hexdigest()
    if st.session_state.get("processed_audio_hash") == audio_hash:
        return None
    st.session_state.processed_audio_hash = audio_hash
    with st.spinner("🎤 Распознаю речь..."):
        return transcribe_audio(blob)
def run_query_pipeline(
    user_input: str,
    model_win1: str,
    model_win2: str,
    model_win3: str,
    model_judge: str,
    llama_placeholder,
    llama_70b_placeholder,
    gemma_placeholder,
    analysis_placeholder,
):
    llama_placeholder.warning(f"{model_win1} думает...")
    llama_70b_placeholder.warning(f"{model_win2} думает...")
    gemma_placeholder.warning(f"{model_win3} думает...")
    analysis_placeholder.warning(f"{model_judge} ожидает ответы окон для синтеза...")
    msgs1 = st.session_state.history_win1 + [{"role": "user", "content": user_input}]
    msgs2 = st.session_state.history_win2 + [{"role": "user", "content": user_input}]
    msgs3 = st.session_state.history_win3 + [{"role": "user", "content": user_input}]
    # Асинхронный/параллельный вызов трёх моделей
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        future_win1 = executor.submit(ask_llm, model_win1, msgs1)
        future_win2 = executor.submit(ask_llm, model_win2, msgs2)
        future_win3 = executor.submit(ask_llm, model_win3, msgs3)
        f1 = executor.submit(ask_llm, m1, msgs1)
        f2 = executor.submit(ask_llm, m2, msgs2)
        f3 = executor.submit(ask_llm, m3, msgs3)
        future_to_win = {
            future_win1: (llama_placeholder, "win1_text", "history_win1", msgs1),
            future_win2: (llama_70b_placeholder, "win2_text", "history_win2", msgs2),
            future_win3: (gemma_placeholder, "win3_text", "history_win3", msgs3)
        }
        f_map = {f1: (p1, "win1_text", "history_win1", msgs1), f2: (p2, "win2_text", "history_win2", msgs2), f3: (p3, "win3_text", "history_win3", msgs3)}
        results = {f1: None, f2: None, f3: None}
        results = {
            future_win1: None,
            future_win2: None,
            future_win3: None
        }
        for future in concurrent.futures.as_completed(future_to_win):
            placeholder, text_key, history_key, msgs = future_to_win[future]
        for future in concurrent.futures.as_completed(f_map):
            p, tk, hk, msgs = f_map[future]
            ans = future.result()
            results[future] = ans
            st.session_state[text_key] = ans
            if not ans.startswith("❌"):
                st.session_state[history_key] = msgs + [{"role": "assistant", "content": ans}]
            render_panel(placeholder, ans)
            st.session_state[tk] = ans
            if not ans.startswith("❌"): st.session_state[hk] = msgs + [{"role": "assistant", "content": ans}]
            p.success(ans) if not ans.startswith("❌") else p.error(ans)
    ans1 = results[future_win1]
    ans2 = results[future_win2]
    ans3 = results[future_win3]
    a1, a2, a3 = results[f1], results[f2], results[f3]
    pj.warning(f"🧠 {mj}...")
    analysis_placeholder.warning(f"{model_judge} проводит синтез...")
    synth_prompt = f"Review the following 3 answers to: '{user_input}'. Point out any errors directly (e.g. 'Model 1 hallucinated...'). Synthesize the best parts into a final structured answer.\n\nWin1: {a1}\n\nWin2: {a2}\n\nWin3: {a3}"
    
    msgs_j = st.session_state.history_judge + [{"role": "user", "content": synth_prompt}]
    final_ans = ask_llm(mj, msgs_j)
    st.session_state.judge_text = final_ans
    if not final_ans.startswith("❌"): st.session_state.history_judge = msgs_j + [{"role": "assistant", "content": final_ans}]
    pj.success(final_ans) if not final_ans.startswith("❌") else pj.error(final_ans)
    synthesis_prompt = f"""
    Перед тобой три независимых ответа нейросетей на один и тот же вопрос: "{user_input}".
    # Save to session history
    chat_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    title = user_input[:25] + "..." if len(user_input) > 25 else user_input
    st.session_state.sessions[chat_id] = {
        "title": title,
        "prompt": user_input,
        "win1": a1, "win2": a2, "win3": a3, "judge": final_ans,
        "h1": st.session_state.history_win1, "h2": st.session_state.history_win2, "h3": st.session_state.history_win3, "hj": st.session_state.history_judge
    }
    st.session_state.active_id = chat_id
    СТРОГОЕ АРХИТЕКТУРНОЕ ТРЕБОВАНИЕ:
    В самом начале своего ответа (перед финальным синтезом) ты обязан сделать краткий
    критический разбор полученных ответов. Если какая-то из трёх моделей допустила
    фактологическую неточность, логическую ошибку или явную галлюцинацию, обязательно
    укажи на это прямо, назвав модель (например: "Модель 1 ошиблась в...").
    Если все модели ответили корректно, кратко отметь это.
def load_session(chat_id):
    s = st.session_state.sessions[chat_id]
    st.session_state.current_prompt = s["prompt"]
    st.session_state.win1_text, st.session_state.win2_text, st.session_state.win3_text, st.session_state.judge_text = s["win1"], s["win2"], s["win3"], s["judge"]
    st.session_state.history_win1, st.session_state.history_win2, st.session_state.history_win3, st.session_state.history_judge = s["h1"], s["h2"], s["h3"], s["hj"]
    st.session_state.active_id = chat_id
    После критического разбора выдай финальный синтез: сопоставь ответы, убери лишнюю воду,
    исправь нестыковки и дай один структурированный исчерпывающий итог на русском языке.
    Окно 1 — модель «{model_win1}»:
    {ans1}
    Окно 2 — модель «{model_win2}»:
    {ans2}
    Окно 3 — модель «{model_win3}»:
    {ans3}
    """
    msgs_judge = st.session_state.history_judge + [{"role": "user", "content": synthesis_prompt}]
    final_analysis = ask_llm(model_judge, msgs_judge)
    st.session_state.judge_text = final_analysis
    if not final_analysis.startswith("❌"):
        st.session_state.history_judge = msgs_judge + [{"role": "assistant", "content": final_analysis}]
    render_panel(analysis_placeholder, final_analysis)
def is_waiting(text: str) -> bool:
    return text in (WAITING_MSG, JUDGE_WAITING_MSG)
def is_judge_waiting(text: str) -> bool:
    return text == JUDGE_WAITING_MSG
def render_panel(placeholder, text: str):
    if is_waiting(text):
        placeholder.info(text)
    elif text.startswith("❌") or text.startswith("Ошибка") or "API ERROR" in text:
        placeholder.error(text)
    elif text.startswith("⚠️") or text.startswith("🚨"):
        placeholder.warning(text)
    else:
        placeholder.success(text)
def reset_chat():
    st.session_state.win1_text = WAITING_MSG
    st.session_state.win2_text = WAITING_MSG
    st.session_state.win3_text = WAITING_MSG
    st.session_state.judge_text = JUDGE_WAITING_MSG
    st.session_state.pop("processed_audio_hash", None)
    st.session_state.pop("pending_user_input", None)
    for key in ("history_win1", "history_win2", "history_win3", "history_judge"):
        st.session_state[key] = []
    for k in ("win1_text", "win2_text", "win3_text", "judge_text", "current_prompt"): st.session_state[k] = ""
    for k in ("history_win1", "history_win2", "history_win3", "history_judge"): st.session_state[k] = []
    st.session_state.active_id = None
@st.dialog("Полный текст ответа", width="large")
def expand_panel(title: str, content: str):
    st.subheader(title)
    st.markdown(content)
@st.dialog("Добро пожаловать в AI Bottleneck!")
def show_welcome():
    st.markdown(
        """
Этот сайт создан для того, чтобы вы могли получить максимально точный и правильный
ответ на любой свой запрос, полностью защищённый от выдумок и галлюцинаций со стороны ИИ.
Мы добились этого благодаря уникальной логике: ваш запрос одновременно отправляется
сразу в три разные независимые нейросети. После этого четвёртая, самая умная модель,
критически анализирует все три полученных варианта, убирает из них ошибки,
соединяет лучшие мысли и сублимирует их в один идеальный, исчерпывающий ответ.
        """
    )
    if st.button("Начать работу", type="primary", use_container_width=True):
        st.session_state.welcome_seen = True
# --- SIDEBAR ---
with st.sidebar:
    st.markdown("<h2 class='neon-text'>⚡ AI Bottleneck</h2>", unsafe_allow_html=True)
    if st.button(T[lng]["new_chat"], use_container_width=True, type="primary"):
        reset_chat()
        st.rerun()
    
    st.divider()
    st.markdown(f"**{T[lng]['history']}**")
    if not st.session_state.sessions:
        st.caption(T[lng]['no_history'])
    else:
        for cid, cdata in reversed(st.session_state.sessions.items()):
            if st.button(cdata["title"], key=f"chat_{cid}", use_container_width=True):
                load_session(cid)
                st.rerun()
    
    st.divider()
    st.markdown(f"**{T[lng]['settings']}**")
    new_lang = st.selectbox(T[lng]["language"], ["en", "ru", "es"], index=["en", "ru", "es"].index(lng))
    if new_lang != lng:
        st.session_state.lang = new_lang
        st.rerun()
def init_session_text():
    for key in ("win1_text", "win2_text", "win3_text"):
        if key not in st.session_state:
            st.session_state[key] = WAITING_MSG
    if "judge_text" not in st.session_state:
        st.session_state.judge_text = JUDGE_WAITING_MSG
    elif st.session_state.judge_text == WAITING_MSG:
        st.session_state.judge_text = JUDGE_WAITING_MSG
    if "welcome_seen" not in st.session_state:
        st.session_state.welcome_seen = False
    for select_key in ("select_win1", "select_win2", "select_win3", "select_judge"):
        if select_key in st.session_state and st.session_state[select_key] not in MODEL_OPTIONS:
            del st.session_state[select_key]
    for key in ("history_win1", "history_win2", "history_win3", "history_judge"):
        if key not in st.session_state:
            st.session_state[key] = []
# --- MAIN UI ---
if st.session_state.current_prompt:
    st.markdown(f"""
    <div class="glass-panel prompt-container">
        <div class="prompt-label">{T[lng]['prompt']}</div>
        <div class="prompt-text">{st.session_state.current_prompt}</div>
    </div>
    """, unsafe_allow_html=True)
def inject_header_brand():
    st.markdown(
        f"""
        <style>
        header[data-testid="stHeader"] {{
            background: transparent;
            position: relative;
        }}
        header[data-testid="stHeader"]::after {{
            content: "{BRAND_NAME}";
            position: absolute;
            left: 3.5rem;
            top: 50%;
            transform: translateY(-50%);
            font-size: 0.85rem;
            font-weight: 600;
            letter-spacing: 0.02em;
            line-height: 1.2;
            white-space: nowrap;
            z-index: 999;
            pointer-events: none;
        }}
        [data-testid="stLogo"] {{
            visibility: hidden !important;
            width: 2.75rem !important;
            min-width: 2.75rem !important;
            overflow: hidden !important;
        }}
        .block-container {{
            padding-top: 1.25rem !important;
        }}
        .brand-header-gap {{
            display: block;
            height: 1.1rem;
            margin-bottom: 0.35rem;
        }}
        </style>
        <div class="brand-header-gap" aria-hidden="true"></div>
        """,
        unsafe_allow_html=True,
    )
def inject_model_col_styles():
    st.markdown(
        f"""
        <style>
        section.main > div[data-testid="stVerticalBlock"] > div[data-testid="stHorizontalBlock"]:first-of-type
        div[data-testid="stVerticalBlockBorderWrapper"] {{
            height: {MODEL_COL_HEIGHT}px !important;
            min-height: {MODEL_COL_HEIGHT}px !important;
            max-height: {MODEL_COL_HEIGHT}px !important;
            overflow-y: auto;
        }}
        div[data-testid="stVerticalBlockBorderWrapper"]:has([data-testid="stAlert"]) {{
            width: 100% !important;
        }}
        /* Фикс прозрачности окна ввода */
        div[data-testid="stChatInput"] {{
            background-color: var(--secondary-background-color) !important;
            opacity: 1 !important;
            border: 1px solid var(--fading-text-color) !important;
        }}
        div[data-testid="stChatInput"] textarea {{
            background-color: var(--secondary-background-color) !important;
            color: var(--text-color) !important;
            opacity: 1 !important;
        }}
        </style>
        """,
        unsafe_allow_html=True,
    )
st.set_page_config(
    page_title="AI Bottleneck — Многоканальный ИИ-Анализатор",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed",
)
inject_header_brand()
inject_model_col_styles()
init_session_text()
if not st.session_state.welcome_seen:
    show_welcome()
col1, col2, col3 = st.columns(3)
with col1:
    with st.container(height=MODEL_COL_HEIGHT, border=True):
        st.subheader("🪟 Окно 1")
        model_win1 = st.selectbox(
            "Модель",
            MODEL_OPTIONS,
            index=model_index(DEFAULT_WIN1),
            key="select_win1",
            label_visibility="collapsed",
        )
        st.caption(MODEL_TRAITS[model_win1])
        llama_placeholder = st.empty()
        render_panel(llama_placeholder, st.session_state.win1_text)
    if st.button("🔍 Расширить окно", key="expand_win1", use_container_width=True):
        expand_panel(f"Окно 1 — {model_win1}", st.session_state.win1_text)
    with st.container(border=True, height=480):
        st.markdown(f"<strong class='neon-text'>{T[lng]['window']} 1</strong>", unsafe_allow_html=True)
        m1 = st.selectbox("M1", MODEL_OPTIONS, index=model_index(DEFAULT_WIN1), label_visibility="collapsed")
        st.caption(MODEL_TRAITS[m1])
        p1 = st.empty()
        if st.session_state.win1_text: p1.success(st.session_state.win1_text)
        else: p1.info(T[lng]['waiting'])
    if st.button(f"{T[lng]['expand']} 1", key="exp1", use_container_width=True): expand_panel(f"{T[lng]['window']} 1", st.session_state.win1_text)
with col2:
    with st.container(height=MODEL_COL_HEIGHT, border=True):
        st.subheader("🪟 Окно 2")
        model_win2 = st.selectbox(
            "Модель",
            MODEL_OPTIONS,
            index=model_index(DEFAULT_WIN2),
            key="select_win2",
            label_visibility="collapsed",
        )
        st.caption(MODEL_TRAITS[model_win2])
        llama_70b_placeholder = st.empty()
        render_panel(llama_70b_placeholder, st.session_state.win2_text)
    if st.button("🔍 Расширить окно", key="expand_win2", use_container_width=True):
        expand_panel(f"Окно 2 — {model_win2}", st.session_state.win2_text)
    with st.container(border=True, height=480):
        st.markdown(f"<strong class='neon-text'>{T[lng]['window']} 2</strong>", unsafe_allow_html=True)
        m2 = st.selectbox("M2", MODEL_OPTIONS, index=model_index(DEFAULT_WIN2), label_visibility="collapsed")
        st.caption(MODEL_TRAITS[m2])
        p2 = st.empty()
        if st.session_state.win2_text: p2.success(st.session_state.win2_text)
        else: p2.info(T[lng]['waiting'])
    if st.button(f"{T[lng]['expand']} 2", key="exp2", use_container_width=True): expand_panel(f"{T[lng]['window']} 2", st.session_state.win2_text)
with col3:
    with st.container(height=MODEL_COL_HEIGHT, border=True):
        st.subheader("🪟 Окно 3")
        model_win3 = st.selectbox(
            "Модель",
            MODEL_OPTIONS,
            index=model_index(DEFAULT_WIN3),
            key="select_win3",
            label_visibility="collapsed",
        )
        st.caption(MODEL_TRAITS[model_win3])
        gemma_placeholder = st.empty()
        render_panel(gemma_placeholder, st.session_state.win3_text)
    if st.button("🔍 Расширить окно", key="expand_win3", use_container_width=True):
        expand_panel(f"Окно 3 — {model_win3}", st.session_state.win3_text)
    with st.container(border=True, height=480):
        st.markdown(f"<strong class='neon-text'>{T[lng]['window']} 3</strong>", unsafe_allow_html=True)
        m3 = st.selectbox("M3", MODEL_OPTIONS, index=model_index(DEFAULT_WIN3), label_visibility="collapsed")
        st.caption(MODEL_TRAITS[m3])
        p3 = st.empty()
        if st.session_state.win3_text: p3.success(st.session_state.win3_text)
        else: p3.info(T[lng]['waiting'])
    if st.button(f"{T[lng]['expand']} 3", key="exp3", use_container_width=True): expand_panel(f"{T[lng]['window']} 3", st.session_state.win3_text)
st.divider()
st.subheader("🧠 Финальный анализ и синтез (блок судьи)")
model_judge = st.selectbox(
    "Модель судьи",
    MODEL_OPTIONS,
    index=model_index(DEFAULT_JUDGE),
    key="select_judge",
)
st.caption(MODEL_TRAITS[model_judge])
st.markdown(f"<h3 class='neon-text'>{T[lng]['finalTitle']}</h3>", unsafe_allow_html=True)
mj = st.selectbox("Judge", MODEL_OPTIONS, index=model_index(DEFAULT_JUDGE), label_visibility="collapsed")
st.caption(MODEL_TRAITS[mj])
with st.container(height=JUDGE_COL_HEIGHT, border=True):
    analysis_placeholder = st.empty()
    judge_display = st.session_state.judge_text
    if is_judge_waiting(judge_display):
        analysis_placeholder.info(judge_display)
    else:
        render_panel(analysis_placeholder, judge_display)
with st.container(border=True):
    pj = st.empty()
    if st.session_state.judge_text: pj.success(st.session_state.judge_text)
    else: pj.info(T[lng]['judge_waiting'])
if st.button("🔍 Расширить окно", key="expand_judge", use_container_width=True):
    expand_panel(f"Блок судьи — {model_judge}", st.session_state.judge_text)
if st.button(f"{T[lng]['expand']} Judge", key="expj", use_container_width=True): expand_panel(T[lng]['finalTitle'], st.session_state.judge_text)
_chat_col, _mic_col, _reset_col = st.columns([5, 1, 1], gap="small", vertical_alignment="bottom")
with _reset_col:
    if st.button("🧹 Новый чат", key="btn_new_chat", use_container_width=True):
        reset_chat()
        st.rerun()
with _mic_col:
    if HAS_AUDIO_INPUT:
        audio_recording = st.audio_input(
            "🎤",
            key="voice_input",
            label_visibility="collapsed",
            sample_rate=16000,
        )
    else:
        audio_recording = None
        st.caption("🎤")
with _chat_col:
    user_input = st.chat_input("Введите ваш вопрос для всех нейросетей сразу...")
# --- BOTTOM INPUT ---
st.write("") # spacing
c_att, c_mic, c_inp = st.columns([1, 1, 6], gap="small", vertical_alignment="bottom")
voice_text = None
if HAS_AUDIO_INPUT and audio_recording is not None:
    try:
        voice_text = handle_voice_input(audio_recording)
    except Exception as exc:
        st.error(f"❌ Ошибка распознавания речи: {type(exc).__name__}: {exc}")
with c_att:
    if st.button(T[lng]["attach"], use_container_width=True):
        if not st.session_state.file_notice_seen: show_file_notice()
if st.session_state.get("pending_user_input"):
    user_input = st.session_state.pop("pending_user_input")
with c_mic:
    if HAS_AUDIO_INPUT:
        st.audio_input(T[lng]["voice"], key="mic", label_visibility="collapsed")
if voice_text:
    st.session_state.pending_user_input = voice_text
    st.rerun()
with c_inp:
    user_input = st.chat_input(T[lng]["chat_input"])
if user_input:
    run_query_pipeline(
        user_input,
        model_win1,
        model_win2,
        model_win3,
        model_judge,
        llama_placeholder,
        llama_70b_placeholder,
        gemma_placeholder,
        analysis_placeholder,
    )
    run_query_pipeline(user_input, m1, m2, m3, mj, p1, p2, p3, pj)
    st.rerun()
