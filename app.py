import streamlit as st
import os
import hashlib
from groq import Groq
from dotenv import load_dotenv
import concurrent.futures
from openai import OpenAI
import google.generativeai as genai

# НАСТРОЙКА ПУТИ: Безопасный способ найти папку проекта, который работает и на сервере
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
}

MODEL_COL_HEIGHT = 480
JUDGE_COL_HEIGHT = 480
BRAND_NAME = "⚡ ai Bottleneck"
WAITING_MSG = "Ожидаю запрос..."
JUDGE_WAITING_MSG = "Ожидаю финальный сублимированный анализ..."
PRIMARY_TIMEOUT = 45.0
WHISPER_MODEL = "whisper-large-v3"
HAS_AUDIO_INPUT = hasattr(st, "audio_input")

def model_index(label: str) -> int:
    try:
        return MODEL_OPTIONS.index(label)
    except ValueError:
        return 0

def ask_llm(model_label: str, prompt_or_messages, timeout: float = PRIMARY_TIMEOUT) -> str:
    cfg = MODEL_REGISTRY.get(model_label)
    if not cfg:
        return f"❌ Неизвестная модель: {model_label}"
    
    provider = cfg["provider"]
    model_id = cfg["id"]
    
    if provider == "gemini" and not GEMINI_API_KEY:
        provider = "groq"
        model_id = FALLBACK_MODELS["gemini"]
    elif provider == "openrouter" and not OPENROUTER_API_KEY:
        provider = "groq"
        model_id = FALLBACK_MODELS["openrouter"]
        
    if provider == "groq" and not GROQ_API_KEY:
         return "❌ Ошибка: GROQ_API_KEY не задан. Невозможно использовать fallback."

    if isinstance(prompt_or_messages, str):
        messages = [{"role": "user", "content": prompt_or_messages}]
    else:
        messages = prompt_or_messages

    try:
        if provider == "groq":
            response = groq_client.chat.completions.create(
                model=model_id,
                messages=messages,
                timeout=timeout,
            )
            return response.choices[0].message.content or "❌ Пустой ответ"
            
        elif provider == "gemini":
            contents = []
            for m in messages:
                role = "user" if m["role"] == "user" else "model"
                contents.append({"role": role, "parts": [m["content"]]})
            model = genai.GenerativeModel(model_id)
            response = model.generate_content(contents)
            return response.text
            
        elif provider == "openrouter":
            response = openrouter_client.chat.completions.create(
                model=model_id,
                messages=messages,
                timeout=timeout,
            )
            return response.choices[0].message.content or "❌ Пустой ответ"
            
    except Exception as exc:
        return f"❌ API ERROR [{model_id}]\nТип: {type(exc).__name__}\nСообщение: {exc}"

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

        future_to_win = {
            future_win1: (llama_placeholder, "win1_text", "history_win1", msgs1),
            future_win2: (llama_70b_placeholder, "win2_text", "history_win2", msgs2),
            future_win3: (gemma_placeholder, "win3_text", "history_win3", msgs3)
        }

        results = {
            future_win1: None,
            future_win2: None,
            future_win3: None
        }

        for future in concurrent.futures.as_completed(future_to_win):
            placeholder, text_key, history_key, msgs = future_to_win[future]
            ans = future.result()
            results[future] = ans
            st.session_state[text_key] = ans
            if not ans.startswith("❌"):
                st.session_state[history_key] = msgs + [{"role": "assistant", "content": ans}]
            render_panel(placeholder, ans)

    ans1 = results[future_win1]
    ans2 = results[future_win2]
    ans3 = results[future_win3]

    analysis_placeholder.warning(f"{model_judge} проводит синтез...")

    synthesis_prompt = f"""
    Перед тобой три независимых ответа нейросетей на один и тот же вопрос: "{user_input}".

    СТРОГОЕ АРХИТЕКТУРНОЕ ТРЕБОВАНИЕ:
    В самом начале своего ответа (перед финальным синтезом) ты обязан сделать краткий
    критический разбор полученных ответов. Если какая-то из трёх моделей допустила
    фактологическую неточность, логическую ошибку или явную галлюцинацию, обязательно
    укажи на это прямо, назвав модель (например: "Модель 1 ошиблась в...").
    Если все модели ответили корректно, кратко отметь это.

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

st.divider()

st.subheader("🧠 Финальный анализ и синтез (блок судьи)")
model_judge = st.selectbox(
    "Модель судьи",
    MODEL_OPTIONS,
    index=model_index(DEFAULT_JUDGE),
    key="select_judge",
)
st.caption(MODEL_TRAITS[model_judge])

with st.container(height=JUDGE_COL_HEIGHT, border=True):
    analysis_placeholder = st.empty()
    judge_display = st.session_state.judge_text
    if is_judge_waiting(judge_display):
        analysis_placeholder.info(judge_display)
    else:
        render_panel(analysis_placeholder, judge_display)

if st.button("🔍 Расширить окно", key="expand_judge", use_container_width=True):
    expand_panel(f"Блок судьи — {model_judge}", st.session_state.judge_text)

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

voice_text = None
if HAS_AUDIO_INPUT and audio_recording is not None:
    try:
        voice_text = handle_voice_input(audio_recording)
    except Exception as exc:
        st.error(f"❌ Ошибка распознавания речи: {type(exc).__name__}: {exc}")

if st.session_state.get("pending_user_input"):
    user_input = st.session_state.pop("pending_user_input")

if voice_text:
    st.session_state.pending_user_input = voice_text
    st.rerun()

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
    st.rerun()
