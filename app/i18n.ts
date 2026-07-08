export type Lang = "ru" | "en" | "es";

export const T = {
  ru: {
    window: "ОКНО",
    finalTitle: "ФИНАЛЬНЫЙ АНАЛИЗ (Аналитик)",
    prompt: "ЗАПРОС",
    welcomeText: "Привет!\n\nЕсли вы часто работаете с искусственным интеллектом, то знаете, что ни одна модель не идеальна: одна сильна в строгой логике, другая — в творчестве, а третья выдаёт ответы молниеносно, но иногда упускает важные детали.\n\nМне пришла в голову идея: почему бы не объединить их сильные стороны? Этот сайт отправляет ваш запрос сразу трём разным ИИ-моделям. После этого четвёртая модель-Аналитик изучает все полученные ответы, убирает лишнее и выдаёт вам идеальную, глубокую выжимку. Вы получаете лучшее от технологий в один клик.",
    start: "Начать работу",
    waiting: "Ожидание запроса...",
    analyst_waiting: "Ожидание ответов для синтеза...",
    new_chat: "Новый чат",
    chat_input: "Задайте вопрос — он улетит сразу в 3 модели...",
    expand: "Расширить",
    file_notice_title: "Внимание",
    file_notice_text: "Прикрепить файл или записать голос? Пожалуйста, убедитесь, что ваш запрос понятен ИИ.",
    got_it: "Понятно",
    history: "История",
    no_history: "Нет сохраненных чатов",
    settings: "Настройки",
    language: "Язык",
    defaultAnalystPrompt: `Вы эксперт ИИ-Аналитик. Ваша задача — синтезировать ответы 3 независимых ИИ.

Ваша работа:
1. ПРОВЕРИТЬ: Ищите фактические ошибки, галлюцинации или противоречия. Помечайте их явно: 'Ошибка Модели 1: [описание]'
2. СРАВНИТЬ: Определите, в чем модели согласны (высокая уверенность), а в чем расходятся (зона неопределенности).
3. СИНТЕЗИРОВАТЬ: Соберите лучший ответ, используя:
   - То, в чем согласны все 3 модели
   - Уникальные правильные инсайты отдельных моделей
   - Ваше собственное исправление, если все 3 модели ошибаются

СТРУКТУРА ОТВЕТА:
**Верификация:** [ошибки или 'Ошибок не найдено']
**Точки согласия:** [в чем все модели согласны]
**Финальный Ответ:** [ваш синтезированный ответ]
**Уверенность:** [Высокая / Средняя / Низкая + причина]`
  },
  en: {
    window: "WINDOW",
    finalTitle: "FINAL ANALYSIS (Analyst)",
    prompt: "PROMPT",
    welcomeText: "Hi!\n\nIf you use AI tools often, you know that no single model is perfect: one excels at strict logic, another shines in creativity, and a third delivers responses lightning-fast, though it might occasionally miss small details.\n\nThat’s why I came up with an idea: why not combine their strengths? This platform sends your prompt to three different AI models simultaneously. Then, a fourth \"Analyst\" model studies all their responses, filters out the noise, and delivers a single, perfected synthesis. You get the best of all worlds in just one click.",
    start: "Get Started",
    waiting: "Waiting for prompt...",
    analyst_waiting: "Waiting for responses to synthesize...",
    new_chat: "New Chat",
    chat_input: "Ask a question — it flies to 3 models at once...",
    expand: "Expand",
    file_notice_title: "Notice",
    file_notice_text: "Attach a file or record voice? Please ensure your prompt is clear.",
    got_it: "Got it",
    history: "History",
    no_history: "No saved chats",
    settings: "Settings",
    language: "Language",
    defaultAnalystPrompt: `You are an expert AI Analyst tasked with synthesizing responses from three independent AI models.

Your job:
1. VERIFY: Check each answer for factual errors, hallucinations, or contradictions. Flag them explicitly: "Model 1 error: [description]"
2. COMPARE: Identify where models agree (high confidence) and where they disagree (uncertainty zone)
3. SYNTHESIZE: Build the best possible answer using:
   - Points all 3 models agree on (highest confidence)
   - Unique correct insights from individual models
   - Your own correction where all 3 models are wrong

OUTPUT STRUCTURE:
**Verification:** [errors found or "No errors detected"]
**Consensus points:** [what all models agree on]  
**Final Answer:** [your synthesized response]
**Confidence:** [High / Medium / Low + reason]`
  },
  es: {
    window: "VENTANA",
    finalTitle: "ANÁLISIS FINAL (Analista)",
    prompt: "CONSULTA",
    welcomeText: "¡Hola!\n\nSi trabajas a menudo con inteligencia artificial, sabrás que ningún modelo es perfecto: uno es excelente con la lógica estricta, otro brilla en la creatividad y un tercero ofrece respuestas a la velocidad del rayo, aunque a veces pueda pasar por alto pequeños detalles.\n\nPor eso se me ocurrió una idea: ¿por qué no unir sus puntos fuertes? Esta web envía tu consulta a tres modelos de IA diferentes al mismo tiempo. Después, un cuarto modelo \"Analista\" estudia todas sus respuestas, elimina lo innecesario y te ofrece una síntesis perfecta. Obtienes lo mejor de la tecnología en un solo clic.",
    start: "Empezar",
    waiting: "Esperando consulta...",
    analyst_waiting: "Esperando respuestas para la síntesis...",
    new_chat: "Nuevo chat",
    chat_input: "Haz una pregunta: vuela a 3 modelos a la vez...",
    expand: "Expandir",
    file_notice_title: "Aviso",
    file_notice_text: "¿Adjuntar archivo o voz? Asegúrate de que tu consulta sea clara.",
    got_it: "Entendido",
    history: "Historia",
    no_history: "No hay chats guardados",
    settings: "Ajustes",
    language: "Idioma",
    defaultAnalystPrompt: `Eres un Analista de IA experto encargado de sintetizar las respuestas de tres modelos de IA independientes.

Tu trabajo:
1. VERIFICAR: Comprueba si hay errores en cada respuesta. Señálalos explícitamente: "Error del Modelo 1: [descripción]"
2. COMPARAR: Identifica en qué coinciden los modelos y en qué discrepan.
3. SINTETIZAR: Construye la mejor respuesta posible usando:
   - Puntos en los que los 3 modelos están de acuerdo
   - Ideas correctas únicas de modelos individuales
   - Tu propia corrección si los 3 modelos se equivocan

ESTRUCTURA DE SALIDA:
**Verificación:** [errores o "No se detectaron errores"]
**Puntos de consenso:** [en qué están de acuerdo todos]
**Respuesta Final:** [tu respuesta sintetizada]
**Confianza:** [Alta / Media / Baja + motivo]`
  }
};

export const WIN1_MODELS = [
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Speed)", provider: "groq" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B (Groq)", provider: "groq" },
  { id: "openai/gpt-4o-mini:free", label: "GPT-4o Mini (OpenRouter)", provider: "openrouter" },
  { id: "google/gemini-flash-1.5-exp", label: "Gemini 1.5 Flash (OpenRouter)", provider: "openrouter" },
  { id: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B (OpenRouter)", provider: "openrouter" }
];

export const WIN2_MODELS = [
  { id: "llama3-70b-8192", label: "Llama 3 70B (Creative)", provider: "groq" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Groq)", provider: "groq" },
  { id: "anthropic/claude-3-haiku:free", label: "Claude 3 Haiku (OpenRouter)", provider: "openrouter" },
  { id: "meta-llama/llama-3.1-70b-instruct:free", label: "Llama 3.1 70B (OpenRouter)", provider: "openrouter" },
  { id: "microsoft/phi-3-medium-128k-instruct:free", label: "Phi-3 Medium (OpenRouter)", provider: "openrouter" }
];

export const WIN3_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Versatile)", provider: "groq" },
  { id: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B (OpenRouter)", provider: "openrouter" },
  { id: "google/gemma-2-27b-it:free", label: "Gemma 2 27B (OpenRouter)", provider: "openrouter" },
  { id: "cohere/command-r-plus:free", label: "Command R+ (OpenRouter)", provider: "openrouter" },
  { id: "databricks/dbrx-instruct:free", label: "DBRX Instruct (OpenRouter)", provider: "openrouter" }
];

export const ANALYST_MODELS = [
  { id: "openai/gpt-4o-2024-08-06", label: "GPT-4o (Expert)", provider: "openrouter" },
  { id: "anthropic/claude-3.5-sonnet:free", label: "Claude 3.5 Sonnet (Deep)", provider: "openrouter" },
  { id: "nvidia/llama-3.1-nemotron-70b-instruct:free", label: "Nemotron 70B (Analytic)", provider: "openrouter" },
  { id: "google/gemini-pro-1.5", label: "Gemini 1.5 Pro (OpenRouter)", provider: "openrouter" }
];
