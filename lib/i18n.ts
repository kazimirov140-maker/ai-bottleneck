export type Lang = "ru" | "en" | "es";

export const T = {
  ru: {
    window: "ОКНО",
    finalTitle: "ФИНАЛЬНЫЙ АНАЛИЗ (Аналитик)",
    prompt: "ЗАПРОС",
    welcomeText: "Привет!\n\nЕсли вы часто работаете с искусственным интеллектом, то знаете, что ни одна модель не идеальна: одна сильна в строгой логике, другая — в творчестве, а третья выдаёт ответы молниеносно, но иногда упускает важные детали.\n\nМне пришла в голову идея: почему бы не объединить их сильные стороны? Этот сайт отправляет ваш запрос сразу трём разным ИИ-моделям. После этого четвёртая модель-Аналитик изучает все полученные ответы, убирает лишнее и выдаёт вам идеальную, глубокую выжимку. Вы получаете лучшее от технологий в один клик.",
    start: "Начать работу",
    waiting: "Ожидание запроса...",
    judge_waiting: "Ожидание ответов для синтеза...",
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
    defaultAnalystPrompt: "Ты — независимый Аналитик. Твоя задача — детально проанализировать ответы трёх ИИ выше, убрать из них галлюцинации, повторы и противоречия, и выдать одну идеальную, структурированную выжимку."
  },
  en: {
    window: "WINDOW",
    finalTitle: "FINAL ANALYSIS (Analyst)",
    prompt: "PROMPT",
    welcomeText: "Hi!\n\nIf you use AI tools often, you know that no single model is perfect: one excels at strict logic, another shines in creativity, and a third delivers responses lightning-fast, though it might occasionally miss small details.\n\nThat’s why I came up with an idea: why not combine their strengths? This platform sends your prompt to three different AI models simultaneously. Then, a fourth \"Analyst\" model studies all their responses, filters out the noise, and delivers a single, perfected synthesis. You get the best of all worlds in just one click.",
    start: "Get Started",
    waiting: "Waiting for prompt...",
    judge_waiting: "Waiting for responses to synthesize...",
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
    defaultAnalystPrompt: "You are an independent Analyst. Your task is to thoroughly analyze the responses of the three AIs above, remove any hallucinations, repetitions, and contradictions, and deliver one perfect, structured synthesis."
  },
  es: {
    window: "VENTANA",
    finalTitle: "ANÁLISIS FINAL (Analista)",
    prompt: "CONSULTA",
    welcomeText: "¡Hola!\n\nSi trabajas a menudo con inteligencia artificial, sabrás que ningún modelo es perfecto: uno es excelente con la lógica estricta, otro brilla en la creatividad y un tercero ofrece respuestas a la velocidad del rayo, aunque a veces pueda pasar por alto pequeños detalles.\n\nPor eso se me ocurrió una idea: ¿por qué no unir sus puntos fuertes? Esta web envía tu consulta a tres modelos de IA diferentes al mismo tiempo. Después, un cuarto modelo \"Analista\" estudia todas sus respuestas, elimina lo innecesario y te ofrece una síntesis perfecta. Obtienes lo mejor de la tecnología en un solo clic.",
    start: "Empezar",
    waiting: "Esperando consulta...",
    judge_waiting: "Esperando respuestas para la síntesis...",
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
    defaultAnalystPrompt: "Eres un Analista independiente. Tu tarea es analizar detalladamente las respuestas de las tres IA anteriores, eliminar alucinaciones, repeticiones y contradicciones, y entregar una síntesis estructurada perfecta."
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

export const JUDGE_MODELS = [
  { id: "openai/gpt-4o-2024-08-06", label: "GPT-4o (Expert)", provider: "openrouter" },
  { id: "anthropic/claude-3.5-sonnet:free", label: "Claude 3.5 Sonnet (Deep)", provider: "openrouter" },
  { id: "nvidia/llama-3.1-nemotron-70b-instruct:free", label: "Nemotron 70B (Analytic)", provider: "openrouter" },
  { id: "google/gemini-pro-1.5", label: "Gemini 1.5 Pro (OpenRouter)", provider: "openrouter" }
];
