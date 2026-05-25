import streamlit as st
import os
from openai import OpenAI
from dotenv import load_dotenv

# НАСТРОЙКА ПУТИ: Находим точную папку, где лежит этот файл app.py
current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(current_dir, '.env')

# Загружаем файл .env строго из папки проекта, чтобы Python его не потерял
load_dotenv(dotenv_path)

# Инициализируем клиент Groq, безопасно забирая ключ из .env
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
)

# Функция для быстрой отправки запросов в Groq
def ask_groq(model_id, prompt):
    try:
        response = client.chat.completions.create(
            model=model_id,
            messages=[{"role": "user", "content": prompt}],
            timeout=15.0
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Ошибка модели {model_id}: {str(e)}"

# Настройка интерфейса приложения Streamlit
st.set_page_config(page_title="AI Bottleneck", layout="wide")
st.title("⚡ Сверхбыстрый хаб AI Bottleneck (База: Groq)")

# Создаем две колонки для базовых моделей
col1, col2 = st.columns(2)

with col1:
    st.subheader("🇺🇸 Llama 3.1 8B (Умная)")
    llama_placeholder = st.empty()
    llama_placeholder.info("Ожидаю запрос...")

with col2:
    st.subheader("🧠 Llama 3.3 70B (Тяжелая)")
    gemma_placeholder = st.empty()
    gemma_placeholder.info("Ожидаю запрос...")

st.divider()

# Секция для финального аналитика
st.subheader("🧐 Финальный Анализ и Синтез (Llama 3.3 70B)")
analysis_placeholder = st.empty()
analysis_placeholder.info("Анализатор готов к работе.")

# Поле ввода внизу страницы
user_input = st.chat_input("Введите ваш вопрос для всех нейросетей сразу...")

if user_input:
    # Ставим статусы ожидания «Думает...»
    llama_placeholder.warning("Llama 3.1 думает...")
    gemma_placeholder.warning("Llama 3.3 думает...")
    analysis_placeholder.warning("Ожидание ответов для проведения синтеза...")
    
    # 1. Запрос к новой Llama 3.1
    llama_ans = ask_groq("llama-3.1-8b-instant", user_input)
    llama_placeholder.success(llama_ans)
    
    # 2. Запрос к мощной Llama 3.3 70B (вместо отключенной Gemma)
    gemma_ans = ask_groq("llama-3.3-70b-versatile", user_input)
    gemma_placeholder.success(gemma_ans)
    
    # 3. Финальный синтез силами тяжелой модели Llama 3.3 70B
    analysis_placeholder.warning("Анализатор проводит финальный синтез...")
    
    synthesis_prompt = f"""
    Перед тобой два ответа нейросетей на один и тот же вопрос: "{user_input}".
    Твоя задача: сопоставить их, убрать лишнее и выдать один точный, краткий сухой остаток на русском языке.
    
    Ответ первой модели: {llama_ans}
    Ответ второй модели: {gemma_ans}
    """
    
    final_analysis = ask_groq("llama-3.3-70b-versatile", synthesis_prompt)
    analysis_placeholder.write(final_analysis)
