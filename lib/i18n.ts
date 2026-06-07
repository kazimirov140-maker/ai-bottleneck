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

export const WORKER_MODELS = [
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (Speed)", provider: "groq" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout (Creative)", provider: "groq" },
  { id: "qwen/qwen3-32b", label: "Qwen 3 32B (Balanced)", provider: "groq" },
  { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B (Balanced)", provider: "openrouter" },
  { id: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B (Fast)", provider: "openrouter" }
];

export const JUDGE_MODELS = [
  { id: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B (Expert)", provider: "openrouter" },
  { id: "nousresearch/hermes-3-llama-3.1-405b:free", label: "Hermes 3 Llama 405B (Deep)", provider: "openrouter" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "Nemotron 3 Ultra 550B (Analytic)", provider: "openrouter" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Versatile)", provider: "groq" }
];
