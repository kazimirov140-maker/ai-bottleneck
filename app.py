import streamlit as st
import os
from groq import Groq

# Настройка страницы
st.set_page_config(page_title="AI Bottleneck", layout="wide")

# --- УБИРАЕМ КРУПНЫЙ ХАБ И ДЕЛАЕМ МАЛЕНЬКИЙ ЛОГОТИП В САМЫЙ ЛЕВЫЙ ВЕРХНИЙ УГОЛ ---
# Это поднимет аккуратную надпись на один уровень со стандартными кнопками вверху
st.logo("🌪 AI Bottleneck", icon_image=None)

# Инициализация клиента Groq
api_key = os.environ.get("GROQ_API_KEY", "")
client = Groq(api_key=api_key) if api_key else None

def call_model(model_name, user_query):
    if not client:
        return "Ошибка: API ключ Groq не найден."
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
    Проанализируй эти 3 ответа ИИ на вопрос: "{user_query}"
    
    Ответ 1: {r1}
    Ответ 2: {r2}
    Ответ 3: {r3}
    
    Убери ошибки, объедини лучшие мысли и сделай один точный, структурированный финальный ответ без повторений.
    """
    try:
        completion = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b", # Наш DeepSeek на роли судьи
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2048,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Ошибка DeepSeek: {str(e)}"

# --- ИНТЕРФЕЙС ПРИЛОЖЕНИЯ ---
# На основном экране сразу отображаются 3 окна моделей
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

# Поле ввода и кнопка находятся строго внизу, под окнами моделей
user_input = st.text_area("Введите ваш запрос или задачу:", placeholder="Например: Напиши план продвижения...")
run_button = st.button("Запустить анализ", type="primary")

st.markdown("---")
st.markdown("### 🧠 DeepSeek (Анализ ответов)")
analysis_placeholder = st.empty()
analysis_placeholder.info("Ожидание запуска...")

# Логика работы кнопки
if run_button:
    if not user_input.strip():
        st.warning("Пожалуйста, введите текст запроса.")
    else:
        p1.info("Генерация ответа...")
        p2.info("Генерация ответа...")
        p3.info("Генерация ответа...")
        analysis_placeholder.info("DeepSeek собирает ответы...")
        
        # Опрашиваем три разные модели
        resp1 = call_model("llama3-8b-8192", user_input)
        p1.write(resp1)
        
        resp2 = call_model("gemma2-9b-it", user_input)
        p2.write(resp2)
        
        resp3 = call_model("mixtral-8x7b-32768", user_input)
        p3.write(resp3)
        
        analysis_placeholder.info("DeepSeek делает выжимку...")
        final_analysis = analyze_responses(user_input, resp1, resp2, resp3)
        analysis_placeholder.write(final_analysis)
