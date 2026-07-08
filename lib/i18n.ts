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
1. ПРОВЕРИТЬ: Ищите фактические ошибки, галлюцинации или противоречия. Помечайте их явно.
2. СРАВНИТЬ: Определите, в чем модели согласны, а в чем расходятся.
3. СИНТЕЗИРОВАТЬ: Соберите лучший ответ.

ВЫ ДОЛЖНЫ ВЕРНУТЬ СТРОГИЙ JSON ФОРМАТ:
{
  "agreements": ["точка согласия 1", "точка согласия 2"],
  "divergences": ["точка расхождения 1"],
  "corrections": ["исправление ошибки Модели X: ..."],
  "final_answer": "Ваш финальный синтезированный ответ в формате Markdown"
}`
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
1. VERIFY: Check each answer for errors, hallucinations, or contradictions.
2. COMPARE: Identify where models agree and where they disagree.
3. SYNTHESIZE: Build the best possible answer.

YOU MUST RETURN A STRICT JSON FORMAT:
{
  "agreements": ["point of agreement 1", "point of agreement 2"],
  "divergences": ["point of divergence 1"],
  "corrections": ["correction of Model X error: ..."],
  "final_answer": "Your final synthesized response in Markdown format"
}`
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
1. VERIFICAR: Comprueba si hay errores en cada respuesta.
2. COMPARAR: Identifica en qué coinciden los modelos y en qué discrepan.
3. SINTETIZAR: Construye la mejor respuesta posible.

DEBES DEVOLVER UN FORMATO JSON ESTRICTO:
{
  "agreements": ["punto de acuerdo 1", "punto de acuerdo 2"],
  "divergences": ["punto de divergencia 1"],
  "corrections": ["corrección del error del Modelo X: ..."],
  "final_answer": "Tu respuesta sintetizada final en formato Markdown"
}`
  }
};

export const WIN1_MODELS = [
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Speed)", provider: "groq" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B (Groq)", provider: "groq" },
  { id: "google/gemini-2.0-flash-lite-preview-02-05:free", label: "Gemini 2.0 Flash Lite (OpenRouter)", provider: "openrouter" }
];

export const WIN2_MODELS = [
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Groq)", provider: "groq" },
  { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash (OpenRouter)", provider: "openrouter" }
];

export const WIN3_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Versatile)", provider: "groq" },
  { id: "google/gemini-2.0-pro-exp-02-05:free", label: "Gemini 2.0 Pro (OpenRouter)", provider: "openrouter" }
];

export const ANALYST_MODELS = [
  { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 (Reasoning)", provider: "groq" },
  { id: "google/gemini-2.0-flash-thinking-exp:free", label: "Gemini 2.0 Thinking (Analytic)", provider: "openrouter" }
];
