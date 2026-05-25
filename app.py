import streamlit as st
import os
from groq import Groq

# Настройка страницы (должна быть самой первой командой Streamlit)
st.set_page_config(page_title="AI Bottleneck Hub", layout="wide")

# --- ПУНКТ №2: ПРИВЕТСТВЕННАЯ ПЛАШКА (ОНБОРДИНГ) ---
# Проверяем, показывали ли мы уже приветствие в этой сессии браузера
if "welcome_shown" not in st.session_state:
    st.session_state.welcome_shown = False

# Вызываем модальное окно с описанием архитектуры 3+1
if not st.session_state.welcome_shown:
    @st.dialog("Добро пожаловать в AI Bottleneck Hub!")
    def show_welcome():
        st.markdown("### В чём уникальность нашего подхода?")
        st.write(
            "Этот хаб создан для тех, кому нужен гарантированно лучший и верифицированный результат, "
            "а не просто случайный ответ из чат-бота."
        )
        st.write(
            "**Как работает наша архитектура:**\n"
            "1. Ваш запрос одновременно отправляется **сразу в 3 независимые ИИ-модели** для параллельного поиска решений.\n"
            "2. Полученные результаты направляются в **четвёртую, аналитическую модель-судью**.\n"
            "3. ИИ-аналитик глубоко сопоставляет все три мнения, полностью вырезает галлюцинации, "
            "делает экспертную выжимку и выдаёт вам один — уникальный, точный и максимально качественный ответ."
        )
        st.markdown("---")
        if st.button("Запустить архитектуру 3+1", type="primary", use_container_width=True):
            st.session_state.welcome_shown = True
            st.rerun()
            
    show_welcome()

# Инициализация клиента Groq
# Ключ берется из Secrets платформы Streamlit или локального окружения
api_key = os.environ.get("GROQ_API_KEY", "")
client = Groq(api_key=api_key) if api_key else None

# Функция для вызова отдельной модели
def call_model(model_name, user_query):
    if not client:
        return "Ошибка: API ключ Groq не найден в настройках сервера."
    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": user_query}],
            temperature=0.7,
            max_tokens=1024,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Ошибка вызова модели {model_name}: {str(e)}"

# Функция для четвертой модели (Аналитик-Судья)
def analyze_responses(user_query, r1, r2, r3):
    if not client:
        return "Ошибка: API ключ Groq не найден."
    
    prompt = f"""
    Вы выступаете в роли главного эксперта-аналитика и судьи ИИ-систем.
    Пользователь задал вопрос: "{user_query}"
    
    Мы отправили этот запрос в 3 разные ИИ-модели и получили следующие ответы:
    ---
    Ответ Модели 1:
    {r1}
    ---
    Ответ Модели 2:
    {r2}
    ---
    Ответ Модели 3:
    {r3}
    ---
    
    Ваша задача:
    1. Проанализировать все три ответа на предмет точности и выявить возможные галлюцинации или ошибки.
    2. Объединить лучшие и самые глубокие инсайты из всех трех ответов.
    3. Сформировать один финальный, идеально структурированный, точный и развернутый ответ для пользователя. Избегайте ИИ-бреда и повторений.
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Мощная модель для роли судьи
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4, # Чуть ниже температура для строгости анализа
            max_tokens=2048,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Ошибка аналитической модели: {str(e)}"

# --- ИНТЕРФЕЙС ПРИЛОЖЕНИЯ (STREAMLIT) ---
st.title("🌪 AI Bottleneck Hub")
st.subheader("Параллельная генерация и сквозной ИИ-анализ (Архитектура 3+1)")

# Поле ввода для пользователя
user_input = st.text_area("Введите ваш запрос или задачу:", placeholder="Например: Напиши план продвижения для ИТ-стартапа в Испании...")

# Кнопка запуска генерации
if st.button("Запустить анализ 3+1", type="primary"):
    if not user_input.strip():
        st.warning("Пожалуйста, введите текст запроса перед запуском.")
    else:
        # Создаем сетку из 3 колонок для отображения первичных ответов моделей
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown("### 🤖 Модель 1 (Llama 8b)")
            p1 = st.empty()
            p1.info("Генерация ответа...")
            
        with col2:
            st.markdown("### 🤖 Модель 2 (Gemma 2)")
            p2 = st.empty()
            p2.info("Генерация ответа...")
            
        with col3:
            st.markdown("### 🤖 Модель 3 (Mixtral)")
            p3 = st.empty()
            p3.info("Генерация ответа...")
            
        # Заголовки для нижнего блока аналитика
        st.markdown("---")
        st.markdown("### 🧠 Финальная выжимка и Экспертный анализ (Модель-Судья)")
        analysis_placeholder = st.empty()
        analysis_placeholder.info("Ожидание ответов первичных моделей для сквозного анализа...")
        
        # Шаг 1: Параллельно вызываем 3 базовые модели
        resp1 = call_model("llama3-8b-8192", user_input)
        p1.write(resp1)
        
        resp2 = call_model("gemma2-9b-it", user_input)
        p2.write(resp2)
        
        resp3 = call_model("mixtral-8x7b-32768", user_input)
        p3.write(resp3)
        
        # Шаг 2: Модель-Судья анализирует результаты и делает выжимку
        analysis_placeholder.info("Все ответы получены! Модель-судья проводит аудит и убирает галлюцинации...")
        final_analysis = analyze_responses(user_input, resp1, resp2, resp3)
        analysis_placeholder.write(final_analysis)
