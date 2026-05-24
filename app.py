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

# Выравнивание интерфейса по центру
col_centered_logo, col_centered_content, _ = st.columns([1, 4, 1])

with col_centered_content:
    # 1. ТОЧНО ПРОВЕРЯЕМ ЛОГОТИП (Берем именно твой металлический Logo.png)
    # Наш красивый металлический логотип с AA
    logo_path = os.path.join(current_dir, 'Logo_v2.png')
    if os.path.exists(logo_path):
        # Выравниваем логотип по центру через специальный метод
        centered_image = st.columns([1, 2, 1])
        with centered_image[1]:
            st.image(logo_path, width=280)
    else:
        # Если логотип вдруг удалили, показываем красивый текст
        st.markdown("<h1 style='text-align: center; color: #3A4F5E;'>AI Bottleneck</h1>", unsafe_allow_html=True)

    # 2. Главный заголовок
    st.markdown("<h2 style='text-align: center;'>⚡ Сверхбыстрый хаб AI Bottleneck</h2>", unsafe_allow_html=True)
    st.markdown("<h3 style='text-align: center; color: #555;'>Введите ваш вопрос для всех нейросетей сразу...</h3>", unsafe_allow_html=True)
    st.write("")

    # 3. ИДЕАЛЬНО ВЫРАВНИВАЕМ ТРИ КОЛОНКИ (Верхняя часть всегда одной высоты)
    col1, col2, col3 = st.columns(3)

    # Заголовок колонки 1 (🇺🇸 Llama 3.1 8B)
    with col1:
        st.subheader("🇺🇸 Llama 3.1 8B (Лёгкая)")
        # Создаем контейнер, который будет *всегда одной высоты* с соседями
        llama_container = st.container(height=350, border=True)
        llama_container.info("Ожидаю запрос...")

    # Заголовок колонки 2 (🇪🇺 Llama 3.3 70B)
    with col2:
        st.subheader("🇪🇺 Llama 3.3 70B (Мощная)")
        llama_70b_container = st.container(height=350, border=True)
        llama_70b_container.info("Ожидаю запрос...")

    # Заголовок колонки 3 (⚡ Llama 3.1 8B (Gemma))
    with col3:
        st.subheader("🤖 Gemma 2 9B (Точная)")
        gemma_container = st.container(height=350, border=True)
        gemma_container.info("Ожидаю запрос...")

st.divider()

# Секция для финального аналитика (DeepSeek-анализ)
st.subheader("🧠 Финальный Анализ и Синтез (DeepSeek)")
analysis_placeholder = st.empty()
analysis_placeholder.info("Анализатор DeepSeek R1 готов к работе.")

# Поле ввода внизу страницы
user_input = st.chat_input("Введите ваш вопрос для всех нейросетей сразу...")

if user_input:
    # 4. ОБНОВЛЯЕМ ОЖИДАНИЕ (Теперь всё ровно и красиво)
    # Ставим статусы ожидания в наши выровненные контейнеры
    llama_container.empty()
    llama_70b_container.empty()
    gemma_container.empty()
    
    llama_container.warning("Llama 3.1 думает...")
    llama_70b_container.warning("Llama 3.3 думает...")
    gemma_container.warning("Gemma 2 думает...")
    analysis_placeholder.warning("Ожидание ответов для проведения синтеза силами DeepSeek...")
    
    # 1. Запрос к первой Llama 3.1 8B
    llama_ans = ask_groq("llama-3.1-8b-instant", user_input)
    llama_container.empty()
    llama_container.success(llama_ans)
    
    # 2. Запрос к мощной Llama 3.3 70B
    llama_70b_ans = ask_groq("llama-3.3-70b-versatile", user_input)
    llama_70b_container.empty()
    llama_70b_container.success(llama_70b_ans)
    
    # 3. Запрос ко второй Llama 3.1 8B (временно вместо Gemma)
    gemma_ans = ask_groq("llama-3.1-8b-instant", user_input)
    gemma_container.empty()
    gemma_container.success(gemma_ans)
    
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
    analysis_placeholder.empty()
    analysis_placeholder.write(final_analysis)