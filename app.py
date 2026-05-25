import streamlit as st
import streamlit.components.v1 as components
import os
import io
import json
import hashlib
from groq import Groq
from dotenv import load_dotenv

# НАСТРОЙКА ПУТИ: Безопасный способ найти папку проекта, который работает и на сервере
current_dir = os.getcwd()
dotenv_path = os.path.join(current_dir, '.env')

load_dotenv(dotenv_path)


def get_groq_api_key() -> str:
    """Streamlit Secrets (прод) или .env (локально)."""
    try:
        return st.secrets["GROQ_API_KEY"]
    except (KeyError, FileNotFoundError, AttributeError, TypeError):
        key = os.getenv("GROQ_API_KEY")
        if key:
            return key
        raise ValueError(
            "GROQ_API_KEY не найден. Добавьте ключ в st.secrets или в файл .env"
        ) from None


client = Groq(api_key=get_groq_api_key())

# Рабочие ID Groq (console.groq.com/docs/models, март 2026)
ID_LLAMA_31_8B = "llama-3.1-8b-instant"
ID_LLAMA_33_70B = "llama-3.3-70b-versatile"
ID_LLAMA_4_SCOUT = "meta-llama/llama-4-scout-17b-16e-instruct"
ID_QWEN3_32B = "qwen/qwen3-32b"
ID_GPT_OSS_20B = "openai/gpt-oss-20b"
ID_GPT_OSS_120B = "openai/gpt-oss-120b"
ID_GPT_OSS_SAFEGUARD = "openai/gpt-oss-safeguard-20b"

# Сняты с API — убраны из списка: gemma2-9b-it, mixtral-8x7b-32768,
# deepseek-r1-distill-llama-70b, llama3-8b-8192, llama3-70b-8192, llama-3.2-*-preview

LABEL_JUDGE_SMARTEST = "GPT-OSS 120B (Самая умная, глубокий синтез)"

# Только модели с рабочими ID; название в UI = реальная модель на Groq
GROQ_MODELS = {
    "Llama 3.1 8B (Сверхбыстрая, production)": ID_LLAMA_31_8B,
    "Llama 4 Scout 17B (Творческие тексты, preview)": ID_LLAMA_4_SCOUT,
    "Llama 3.3 70B (Универсальная, production)": ID_LLAMA_33_70B,
    "Qwen 3 32B (Логика и структура, preview)": ID_QWEN3_32B,
    "GPT-OSS 20B (Быстрая и умная, production)": ID_GPT_OSS_20B,
    LABEL_JUDGE_SMARTEST: ID_GPT_OSS_120B,
    "GPT-OSS Safeguard 20B (Модерация, preview)": ID_GPT_OSS_SAFEGUARD,
}

MODEL_OPTIONS = list(GROQ_MODELS.keys())

DEFAULT_WIN1 = "Llama 3.1 8B (Сверхбыстрая, production)"
DEFAULT_WIN2 = "Llama 4 Scout 17B (Творческие тексты, preview)"
DEFAULT_WIN3 = "Qwen 3 32B (Логика и структура, preview)"
DEFAULT_JUDGE = LABEL_JUDGE_SMARTEST

MODEL_TRAITS = {
    "Llama 3.1 8B (Сверхбыстрая, production)": (
        "✅ llama-3.1-8b-instant — самая быстрая production-модель. "
        "⚠️ Слабее на сложной логике."
    ),
    "Llama 4 Scout 17B (Творческие тексты, preview)": (
        "✅ meta-llama/llama-4-scout-17b-16e-instruct — живой стиль, окно 2. "
        "⚠️ Preview: может измениться на Groq."
    ),
    "Llama 3.3 70B (Универсальная, production)": (
        "✅ llama-3.3-70b-versatile — сильный баланс качества и скорости. "
        "⚠️ Дороже и медленнее 8B."
    ),
    "Qwen 3 32B (Логика и структура, preview)": (
        "✅ qwen/qwen3-32b — списки, аналитика, структура, окно 3. "
        "⚠️ Preview-модель."
    ),
    "GPT-OSS 20B (Быстрая и умная, production)": (
        "✅ openai/gpt-oss-20b — ~1000 t/s, хорошее качество. "
        "⚠️ Уступает 120B на сложном синтезе."
    ),
    LABEL_JUDGE_SMARTEST: (
        "✅ openai/gpt-oss-120b — самая умная, окно 4 (судья). "
        "⚠️ Дольше ждать ответ."
    ),
    "GPT-OSS Safeguard 20B (Модерация, preview)": (
        "✅ openai/gpt-oss-safeguard-20b — проверка безопасности текста. "
        "⚠️ Не для обычных ответов пользователю."
    ),
}

MODEL_COL_HEIGHT = 480
JUDGE_COL_HEIGHT = 480
BRAND_NAME = "⚡ ai Bottleneck"
WAITING_MSG = "Ожидаю запрос..."
JUDGE_WAITING_MSG = "Ожидаю финальный сублимированный анализ..."
PRIMARY_TIMEOUT = 45.0
WHISPER_MODEL = "whisper-large-v3"
VALID_MODEL_IDS = set(GROQ_MODELS.values())
TEXT_KEYS = ("win1_text", "win2_text", "win3_text", "judge_text")
HAS_AUDIO_INPUT = hasattr(st, "audio_input")


def model_index(label: str) -> int:
    return MODEL_OPTIONS.index(label)


def groq_model_id(selectbox_label: str) -> str:
    """Из selectbox (человеческое имя) → технический ID Groq API."""
    return GROQ_MODELS[selectbox_label]


def ask_groq(model_id: str, prompt: str, timeout: float = PRIMARY_TIMEOUT) -> str:
    """Прямой вызов Groq API. Без каскада — ошибки видны в окне."""
    if model_id not in VALID_MODEL_IDS:
        return (
            f"❌ DEBUG: передан неверный model_id '{model_id}'.\n"
            f"Допустимые ID: {', '.join(sorted(VALID_MODEL_IDS))}"
        )

    try:
        response = client.chat.completions.create(
            model=model_id,
            messages=[{"role": "user", "content": prompt}],
            timeout=timeout,
        )
        content = response.choices[0].message.content
        if not content:
            return f"❌ API ERROR [{model_id}]: пустой ответ (content is None)"
        return content
    except Exception as exc:
        exc_type = type(exc).__name__
        return (
            f"❌ API ERROR [{model_id}]\n"
            f"Тип: {exc_type}\n"
            f"Сообщение: {exc}"
        )


def transcribe_audio(audio_blob: bytes) -> str:
    """Распознавание голоса через Groq Whisper."""
    result = client.audio.transcriptions.create(
        file=("voice.wav", audio_blob),
        model=WHISPER_MODEL,
        language="ru",
    )
    text = getattr(result, "text", None)
    if text:
        return text.strip()
    return str(result).strip()


def handle_voice_input(audio_file) -> str | None:
    """Возвращает текст запроса из новой аудиозаписи или None."""
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


@st.cache_data(show_spinner=False)
def synthesize_speech_mp3(text: str) -> bytes:
    """Озвучка финального ответа (gTTS, русский)."""
    from gtts import gTTS

    snippet = text[:2500]
    buf = io.BytesIO()
    gTTS(text=snippet, lang="ru").write_to_fp(buf)
    buf.seek(0)
    return buf.read()


def render_tts_controls(text: str, autoplay: bool = False):
    """Плеер + браузерная озвучка SpeechSynthesis."""
    if is_judge_waiting(text) or text.startswith("❌"):
        return

    play_mp3 = st.button("🔊 Прослушать ответ", key="btn_tts_play", use_container_width=True)
    if play_mp3 or autoplay:
        try:
            mp3 = synthesize_speech_mp3(text)
            st.audio(mp3, format="audio/mp3", autoplay=True)
        except Exception as exc:
            st.warning(f"MP3-озвучка недоступна: {exc}")

    tts_payload = json.dumps(text[:3000], ensure_ascii=False)
    auto_js = "speak();" if autoplay else ""
    components.html(
        f"""
        <script>
        (function() {{
            const text = {tts_payload};
            function speak() {{
                if (!("speechSynthesis" in window)) return;
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = "ru-RU";
                u.rate = 0.95;
                window.speechSynthesis.speak(u);
            }}
            window.speakJudgeAnswer = speak;
            {auto_js}
        }})();
        </script>
        <button onclick="window.speakJudgeAnswer && window.speakJudgeAnswer()"
                style="margin-top:0.35rem;padding:0.45rem 0.9rem;border-radius:0.5rem;
                       border:1px solid #ccc;background:#f7f7f7;cursor:pointer;width:100%;">
            🔊 Озвучить в браузере
        </button>
        """,
        height=70,
    )


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
    id_win1 = groq_model_id(model_win1)
    id_win2 = groq_model_id(model_win2)
    id_win3 = groq_model_id(model_win3)
    id_judge = groq_model_id(model_judge)

    llama_placeholder.warning(f"{model_win1} думает...")
    llama_70b_placeholder.warning(f"{model_win2} думает...")
    gemma_placeholder.warning(f"{model_win3} думает...")
    analysis_placeholder.warning(f"{model_judge} ожидает ответы окон для синтеза...")

    llama_ans = ask_groq(id_win1, user_input)
    st.session_state.win1_text = llama_ans
    render_panel(llama_placeholder, llama_ans)

    llama_70b_ans = ask_groq(id_win2, user_input)
    st.session_state.win2_text = llama_70b_ans
    render_panel(llama_70b_placeholder, llama_70b_ans)

    gemma_ans = ask_groq(id_win3, user_input)
    st.session_state.win3_text = gemma_ans
    render_panel(gemma_placeholder, gemma_ans)

    analysis_placeholder.warning(f"{model_judge} проводит синтез...")

    synthesis_prompt = f"""
    Перед тобой три независимых ответа нейросетей на один и тот же вопрос: "{user_input}".

    СТРОГОЕ АРХИТЕКТУРНОЕ ТРЕБОВАНИЕ:
    В самом начале своего ответа (перед финальным синтезом) ты обязан сделать краткий
    критический разбор полученных ответов. Если какая-то из трёх моделей допустила
    фактологическую неточность, логическую ошибку или явную галлюцинацию, обязательно
    укажи на это прямо, назвав модель (например: "Llama 3.1 ошиблась в...").
    Если все модели ответили корректно, кратко отметь это.

    После критического разбора выдай финальный синтез: сопоставь ответы, убери лишнюю воду,
    исправь нестыковки и дай один структурированный исчерпывающий итог на русском языке.

    Окно 1 — модель «{model_win1}»:
    {llama_ans}

    Окно 2 — модель «{model_win2}»:
    {llama_70b_ans}

    Окно 3 — модель «{model_win3}»:
    {gemma_ans}
    """

    final_analysis = ask_groq(id_judge, synthesis_prompt)
    st.session_state.judge_text = final_analysis
    st.session_state.tts_autoplay = True
    render_panel(analysis_placeholder, final_analysis)


def is_waiting(text: str) -> bool:
    return text in (WAITING_MSG, JUDGE_WAITING_MSG)


def is_judge_waiting(text: str) -> bool:
    return text == JUDGE_WAITING_MSG


def render_panel(placeholder, text: str):
    """Отрисовка замороженного ответа из session_state без сброса при rerun."""
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
    st.session_state.pop("tts_autoplay", None)


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
сразу в три разные независимые нейросети. После этого четвёртая, самая умная модель
(GPT-OSS 120B), критически анализирует все три полученных варианта, убирает из них ошибки,
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


def inject_header_brand():
    """Полное название в верхней панели Streamlit + отступ до сетки колонок."""
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
    """Фиксированная высота окон: три колонки + широкий блок судьи."""
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
        </style>
        """,
        unsafe_allow_html=True,
    )


st.set_page_config(
    page_title=BRAND_NAME,
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

tts_autoplay = st.session_state.pop("tts_autoplay", False)
render_tts_controls(st.session_state.judge_text, autoplay=tts_autoplay)

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
