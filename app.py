import streamlit as st
import os
from groq import Groq

# Настройка страницы
st.set_page_config(page_title="AI Bottleneck", layout="wide")

# Инициализация клиента Groq (берём ключ напрямую из секретов сервера Streamlit)
api_key = os.environ.get("GROQ_API_KEY", "")
client = Groq(api_key=api_key) if api_key else None

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
        return f"Ошибка модели {model_name}: {str(e)}"

def analyze_responses(user_query, r1, r2, r3):
    if not client:
        return "Ошибка: API ключ Groq не найден."
    
    prompt = f"""
    Вы выступаете в роли главного эксперта-аналитика.
    Пользователь задал вопрос: "{user_query}"
    
    Мы получили 3 разных ответа от ИИ:
    ---
    Ответ 1:
    {r1}
    ---
    Ответ 2:
    {r2}
    ---
    Ответ 3:
    {r3}
    ---
    
    Проанализируйте их, уберите ошибки и повторения, объедините лучшие мысли и сделайте один идеальный, структурированный финальный ответ.
    """
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=2048,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Ошибка анализа: {str(e)}"

# --- ИНТЕРФЕЙС ПРИЛОЖЕНИЯ ---
st.title("🌪 AI Bottleneck")

user_input = st.text_area("Введите ваш запрос или задачу:", placeholder="Например: Напиши план продвижения...")

# Создаем разметку из 3 колонок сразу на главном экране, чтобы окна не пропадали
col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("### 🤖 Модель 1 (Llama 8b)")
    p1 = st.empty()
    p1.info("Ожидание запроса...")
    
with col2:
    st.markdown("### 🤖 Модель 2 (Gemma 2)")
    p2 = st.empty()
    p2.info("Ожидание запроса...")
    
with col3:
    st.markdown("### 🤖 Модель 3 (Mixtral)")
    p3 = st.empty()
    p3.info("Ожидание запроса...")
    
st.markdown("---")
st.markdown("### 🧠 Финальная выжимка и Экспертный анализ")
analysis_placeholder = st.empty()
analysis_placeholder.info("Ожидание запуска анализа...")

# Кнопка запуска
if st.button("Запустить анализ", type="primary"):
    if not user_input.strip():
        st.warning("Пожалуйста, введите текст запроса.")
    else:
        # Меняем статус на генерацию
        p1.info("Генерация ответа...")
        p2.info("Генерация ответа...")
        p3.info("Генерация ответа...")
        analysis_placeholder.info("Ожидание ответов моделей для сквозного анализа...")
        
        # Запускаем сбор ответов
        resp1 = call_model("llama3-8b-8192", user_input)
        p1.write(resp1)
        
        resp2 = call_model("gemma2-9b-it", user_input)
        p2.write(resp2)
        
        resp3 = call_model("mixtral-8x7b-32768", user_input)
        p3.write(resp3)
        
        # Передаем ответы судье
        analysis_placeholder.info("Анализатор делает финальную выжимку...")
        final_analysis = analyze_responses(user_input, resp1, resp2, resp3)
        analysis_placeholder.write(final_analysis)
