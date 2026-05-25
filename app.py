import streamlit as st
import os
from openai import OpenAI
from dotenv import load_dotenv

# НАСТРОЙКА ПУТИ: Безопасный способ найти папку проекта, который работает и на сервере
current_dir = os.getcwd()
dotenv_path = os.path.join(current_dir, '.env')

load_dotenv(dotenv_path)

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
)

GROQ_MODELS = {
    "Llama 3.1 8B (Сверхбыстрая, для простых запросов)": "llama-3.1-8b-instant",
    "Gemma 2 9B (Красивый слог, творческие тексты)": "gemma2-9b-it",
    "Mixtral 8x7B (Строгая логика, списки, структура)": "mixtral-8x7b-32768",
    "DeepSeek R1 70B (Самая умная, глубокий пошаговый анализ)": "deepseek-r1-distill-llama-70b",
    "Llama 3.3 70B (Мощная универсальная, отличный баланс)": "llama-3.3-70b-versatile",
    "Llama 3.2 1B (Моментальный ответ, микро-модель)": "llama-3.2-1b-preview",
    "Llama 3.2 3B (Очень быстрая, для коротких ответов)": "llama-3.2-3b-preview",
    "Llama 3 8B (Базовая быстрая модель)": "llama3-8b-8192",
    "Llama 3 70B (Стабильная тяжелая модель)": "llama3-70b-8192",
    "Llama Guard 3 8B (Анализ безопасности текста)": "llama-guard-3-8b",
}

MODEL_OPTIONS = list(GROQ_MODELS.keys())

DEFAULT_WIN1 = "Llama 3.1 8B (Сверхбыстрая, для простых запросов)"
DEFAULT_WIN2 = "Gemma 2 9B (Красивый слог, творческие тексты)"
DEFAULT_WIN3 = "Mixtral 8x7B (Строгая логика, списки, структура)"
DEFAULT_JUDGE = "DeepSeek R1 70B (Самая умная, глубокий пошаговый анализ)"

MODEL_TRAITS = {
    "Llama 3.1 8B (Сверхбыстрая, для простых запросов)": (
        "✅ Плюсы: максимальная скорость, низкая задержка, идеальна для FAQ и черновиков. "
        "⚠️ Минусы: слабее на сложной логике и длинных рассуждениях."
    ),
    "Gemma 2 9B (Красивый слог, творческие тексты)": (
        "✅ Плюсы: живой стиль, хороша для постов, идей и перефразирования. "
        "⚠️ Минусы: может уходить в «воду», хуже на жёстких фактах."
    ),
    "Mixtral 8x7B (Строгая логика, списки, структура)": (
        "✅ Плюсы: чёткая структура, списки, сравнения, пошаговые планы. "
        "⚠️ Минусы: медленнее лёгких 8B-моделей."
    ),
    "DeepSeek R1 70B (Самая умная, глубокий пошаговый анализ)": (
        "✅ Плюсы: глубокий разбор, цепочка рассуждений, синтез и проверка. "
        "⚠️ Минусы: самая медленная, ответы длиннее."
    ),
    "Llama 3.3 70B (Мощная универсальная, отличный баланс)": (
        "✅ Плюсы: универсал — код, анализ, тексты в одном окне. "
        "⚠️ Минусы: выше нагрузка и время ответа, чем у 8B."
    ),
    "Llama 3.2 1B (Моментальный ответ, микро-модель)": (
        "✅ Плюсы: почти мгновенный отклик, минимум ресурсов. "
        "⚠️ Минусы: поверхностные ответы, риск галлюцинаций."
    ),
    "Llama 3.2 3B (Очень быстрая, для коротких ответов)": (
        "✅ Плюсы: быстрые краткие ответы, лёгкая модель. "
        "⚠️ Минусы: ограничена сложными задачами."
    ),
    "Llama 3 8B (Базовая быстрая модель)": (
        "✅ Плюсы: проверенная база, предсказуемое качество. "
        "⚠️ Минусы: уступает свежим Llama 3.1/3.3."
    ),
    "Llama 3 70B (Стабильная тяжелая модель)": (
        "✅ Плюсы: стабильность на объёмных запросах. "
        "⚠️ Минусы: медленнее и тяжелее новых 70B."
    ),
    "Llama Guard 3 8B (Анализ безопасности текста)": (
        "✅ Плюсы: модерация, риски, токсичность, политики контента. "
        "⚠️ Минусы: не для генерации обычных ответов пользователю."
    ),
}

MODEL_COL_HEIGHT = 480
JUDGE_COL_HEIGHT = 420
WAITING_MSG = "Ожидаю запрос..."
PRIMARY_TIMEOUT = 10.0
FALLBACK_MODEL_70B = "llama-3.3-70b-versatile"
FALLBACK_MODEL_8B = "llama-3.1-8b-instant"
FALLBACK_NOTE_70B = (
    "⚠️ [Выбранная модель дала сбой. Авто-переключение на Llama 3.3 70B]:\n\n"
)
FALLBACK_NOTE_8B = (
    "🚨 [Критический сбой сети. Ответ получен от резервной Llama 3.1 8B]:\n\n"
)
TEXT_KEYS = ("win1_text", "win2_text", "win3_text", "judge_text")


def model_index(label: str) -> int:
    return MODEL_OPTIONS.index(label)


def _groq_single_request(model_id: str, prompt: str, timeout: float) -> str:
    response = client.chat.completions.create(
        model=model_id,
        messages=[{"role": "user", "content": prompt}],
        timeout=timeout,
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError(f"Пустой ответ от модели {model_id}")
    return content


def ask_groq(model_id: str, prompt: str, timeout: float = PRIMARY_TIMEOUT) -> str:
    """Каскад: выбранная модель → Llama 3.3 70B → Llama 3.1 8B."""
    chain: list[tuple[str, str | None]] = [(model_id, None)]
    if model_id != FALLBACK_MODEL_70B:
        chain.append((FALLBACK_MODEL_70B, FALLBACK_NOTE_70B))
    if model_id != FALLBACK_MODEL_8B:
        chain.append((FALLBACK_MODEL_8B, FALLBACK_NOTE_8B))

    errors: list[str] = []
    for attempt_model, prefix in chain:
        try:
            text = _groq_single_request(attempt_model, prompt, timeout)
            return f"{prefix}{text}" if prefix else text
        except Exception as exc:
            errors.append(f"{attempt_model}: {exc}")

    return (
        "❌ Не удалось получить ответ: все три попытки завершились с ошибкой.\n\n"
        + "\n".join(f"• {err}" for err in errors)
    )


def is_waiting(text: str) -> bool:
    return text == WAITING_MSG


def render_panel(placeholder, text: str):
    """Отрисовка замороженного ответа из session_state без сброса при rerun."""
    if is_waiting(text):
        placeholder.info(text)
    elif text.startswith("❌") or text.startswith("Ошибка"):
        placeholder.error(text)
    elif text.startswith("⚠️") or text.startswith("🚨"):
        placeholder.warning(text)
    else:
        placeholder.success(text)


def reset_chat():
    for key in TEXT_KEYS:
        st.session_state[key] = WAITING_MSG


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
(DeepSeek), критически анализирует все три полученных варианта, убирает из них ошибки,
соединяет лучшие мысли и сублимирует их в один идеальный, исчерпывающий ответ.
        """
    )
    if st.button("Начать работу", type="primary", use_container_width=True):
        st.session_state.welcome_seen = True
        st.rerun()


def init_session_text():
    for key in ("win1_text", "win2_text", "win3_text", "judge_text"):
        if key not in st.session_state:
            st.session_state[key] = WAITING_MSG
    if "welcome_seen" not in st.session_state:
        st.session_state.welcome_seen = False


def inject_header_brand():
    """Название в верхней панели Streamlit, на одной линии с Share / ⋮."""
    st.markdown(
        """
        <style>
        .block-container {
            padding-top: 0.75rem !important;
        }
        header[data-testid="stHeader"] {
            background: transparent;
        }
        [data-testid="stLogo"] {
            display: inline-flex !important;
            align-items: center !important;
            gap: 0.35rem;
        }
        [data-testid="stLogo"]::after {
            content: "ai Bottleneck";
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: 0.02em;
            line-height: 1;
            white-space: nowrap;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def inject_model_col_styles():
    """Фиксированная высота окон ответов в трёх верхних колонках."""
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
        </style>
        """,
        unsafe_allow_html=True,
    )


st.set_page_config(
    page_title="⚡ ai Bottleneck",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed",
)
st.logo("⚡", size="small", icon_image=None)
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
    render_panel(analysis_placeholder, st.session_state.judge_text)

if st.button("🔍 Расширить окно", key="expand_judge", use_container_width=True):
    expand_panel(f"Блок судьи — {model_judge}", st.session_state.judge_text)

_chat_col, _reset_col = st.columns([6, 1], gap="small", vertical_alignment="bottom")
with _reset_col:
    if st.button("🧹 Новый чат", key="btn_new_chat", use_container_width=True):
        reset_chat()
        st.rerun()
with _chat_col:
    user_input = st.chat_input("Введите ваш вопрос для всех нейросетей сразу...")

if user_input:
    id_win1 = GROQ_MODELS[model_win1]
    id_win2 = GROQ_MODELS[model_win2]
    id_win3 = GROQ_MODELS[model_win3]
    id_judge = GROQ_MODELS[model_judge]

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
    render_panel(analysis_placeholder, final_analysis)
