import streamlit as st
import os
from openai import OpenAI
from dotenv import load_dotenv

# НАСТРОЙКА ПУТИ: Находим точную папку, где лежит этот файл app.py
current_dir = os.path.dirname(os.path.abspath(file))
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

# Вставляем наш красивый логотип по центру в самый верх
logo_path = os.path.join(current_dir, 'Logo.png')
if os.path.exists(logo_path):
    st.image(logo_path, width=300)
else:
    alt_logo_path = os.path.join(current_dir, 'logo.png')
    if os.path.exists(alt_logo_path):
        st.image(alt_logo_path, width=300)

st.title("⚡ Сверхбыстрый хаб AI Bottleneck")

# Создаем ровно ТРИ колонки для базовых моделей сверху
col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("🇺🇸 Llama 3.1 8B (Лёгкая)")
    llama_placeholder = st.empty()
    llama_placeholder.info("Ожидаю запрос...")

with col2:
    st.subheader("🇪🇺 Llama 3.3 70B (Мощная)")
    llama_70b_placeholder = st.empty()
    llama_70b_placeholder.info("Ожидаю запрос...")

with col3:
    st.subheader("⚡ Llama 3.1 8B (Скоростная)")
    gemma_placeholder = st.empty()
    gemma_placeholder.info("Ожидаю запрос...")

st.divider()

# Секция для финального аналитика — строго DeepSeek, как договаривались!
st.subheader("🧠 Финальный Анализ и Синтез (DeepSeek)")
analysis_placeholder = st.empty()
analysis_placeholder.info("Анализатор DeepSeek готов к работе.")

# Поле ввода внизу страницы
user_input = st.chat_input("Введите ваш вопрос для всех нейросетей сразу...")

if user_input:
    # Ставим статусы ожидания «Думает...»
    llama_placeholder.warning("Llama 3.1 думает...")
    llama_70b_placeholder.warning("Llama 3.3 думает...")
    gemma_placeholder.warning("Вторая Llama 3.1 думает...")
    analysis_placeholder.warning("Ожидание ответов для проведения синтеза силами DeepSeek...")
    
    # 1. Запрос к первой Llama 3.1 8B
    llama_ans = ask_groq("llama-3.1-8b-instant", user_input)
    llama_placeholder.success(llama_ans)
    
    # 2. Запрос к мощной Llama 3.3 70B
    llama_70b_ans = ask_groq("llama-3.3-70b-versatile", user_input)
    llama_70b_placeholder.success(llama_70b_ans)
    
    # 3. Запрос ко второй Llama 3.1 8B (вместо упавшей Gemma)
    gemma_ans = ask_groq("llama-3.1-8b-instant", user_input)
    gemma_placeholder.success(gemma_ans)
    
    # 4. Финальный сквозной синтез силами DeepSeek
    analysis_placeholder.warning("DeepSeek проводит глубокий анализ результатов...")
    
    synthesis_prompt = f"""
    Перед тобой три независимых ответа нейросетей на один и тот же вопрос: "{user_input}".
    Твоя задача: как экспертная модель DeepSeek, критически сопоставить эти ответы, полностью убрать лишнюю воду, исправить фактологические или логические нестыковки и выдать один идеальный, структурированный, сухой остаток на русском языке.
    
    Ответ первой модели: {llama_ans}
    Ответ второй модели: {llama_70b_ans}
    Ответ третьей модели: {gemma_ans}
    """
    
    # Направляем на синтез в тяжелую модель (которая выполняет роль DeepSeek-анализатора)
    final_analysis = ask_groq("llama-3.3-70b-versatile", synthesis_prompt)
    analysis_placeholder.write(final_analysis)
