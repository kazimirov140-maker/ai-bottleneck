import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import OpenAI from "openai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const openRouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const getClientAndModel = (modelId: string, provider: string) => {
  if (provider === "groq") return { client: groq, id: modelId };
  if (provider === "openrouter") return { client: openRouter, id: modelId };
  return null;
};

async function callModel(messages: any[], modelConfig: { id: string; provider: string }) {
  try {
    const { client, id } = getClientAndModel(modelConfig.id, modelConfig.provider)!;
    
    // Convert generic messages to OpenAI format
    const formattedMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // @ts-ignore
    const response = await client.chat.completions.create({
      model: id,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || "❌ Empty response";
  } catch (error: any) {
    console.error(`Error with model ${modelConfig.id}:`, error);
    return `❌ API Error [${modelConfig.id}]: ${error.message}`;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phase, messages, models, analystPrompt, workerAnswers } = body;

    // phase: "workers" or "analyst"
    // For workers: we expect { phase: "workers", messages: { win1: [], win2: [], win3: [] }, models: { win1, win2, win3 } }
    
    if (phase === "workers") {
      const [ans1, ans2, ans3] = await Promise.all([
        callModel(messages.win1, models.win1),
        callModel(messages.win2, models.win2),
        callModel(messages.win3, models.win3),
      ]);
      return NextResponse.json({ ans1, ans2, ans3 });
    }

    if (phase === "analyst") {
      // For analyst: we expect { phase: "analyst", messages: [], model: {...}, analystPrompt, workerAnswers: [a1, a2, a3] }
      // We take the conversation history of the analyst (if any) and append the synthesis request.
      
      const lastUserMessage = messages[messages.length - 1].content;
      
      const synthesisPrompt = `
User's Question: "${lastUserMessage}"

Response from AI 1:
${workerAnswers[0]}

Response from AI 2:
${workerAnswers[1]}

Response from AI 3:
${workerAnswers[2]}

Please provide your analysis based on your system instructions.
      `.trim();

      const finalMessages = [
        { role: "system", content: analystPrompt },
        // Add previous analyst context if any (excluding the last user prompt which we just embedded with answers)
        ...messages.slice(0, -1),
        { role: "user", content: synthesisPrompt }
      ];

      const ansAnalyst = await callModel(finalMessages, models.analyst);
      return NextResponse.json({ ansAnalyst });
    }

    return NextResponse.json({ error: "Invalid phase" }, { status: 400 });

  } catch (err: any) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
