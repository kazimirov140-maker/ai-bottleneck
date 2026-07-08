import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { WIN1_MODELS, WIN2_MODELS, WIN3_MODELS, ANALYST_MODELS, T } from "@/lib/i18n";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const EXTERNAL_API_TOKEN = process.env.EXTERNAL_API_TOKEN || "my-secret-token";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${EXTERNAL_API_TOKEN}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.query) {
      return NextResponse.json({ error: "Missing 'query' in request body" }, { status: 400 });
    }

    const { query, models: reqModels } = body;

    const win1Model = reqModels?.win1 || WIN1_MODELS[0].id;
    const win2Model = reqModels?.win2 || WIN2_MODELS[0].id;
    const win3Model = reqModels?.win3 || WIN3_MODELS[0].id;
    const analystModel = reqModels?.analyst || ANALYST_MODELS[0].id;

    // 1. Run 3 workers in parallel
    const getWorkerResponse = async (model: string, queryText: string) => {
      const res = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: queryText }],
        temperature: 0.7,
        max_tokens: 2000,
      });
      return res.choices[0]?.message?.content || "";
    };

    const [ans1, ans2, ans3] = await Promise.all([
      getWorkerResponse(win1Model, query),
      getWorkerResponse(win2Model, query),
      getWorkerResponse(win3Model, query)
    ]);

    // 2. Run analyst
    const defaultAnalystPrompt = T["ru"].defaultAnalystPrompt;
    const systemPrompt = `
      ${defaultAnalystPrompt}
      ОТВЕТЫ МОДЕЛЕЙ:
      --- МОДЕЛЬ 1 ---
      ${ans1}
      --- МОДЕЛЬ 2 ---
      ${ans2}
      --- МОДЕЛЬ 3 ---
      ${ans3}
    `;

    const analystRes = await groq.chat.completions.create({
      model: analystModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.4,
      max_tokens: 3000,
    });

    const ansAnalyst = analystRes.choices[0]?.message?.content || "";

    // 3. Parse JSON from Analyst
    let parsedAnalyst = null;
    try {
      const match = ansAnalyst.match(/\{[\s\S]*\}/);
      if (match) {
        parsedAnalyst = JSON.parse(match[0]);
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      workers: {
        win1: ans1,
        win2: ans2,
        win3: ans3
      },
      analyst: parsedAnalyst || { final_answer: ansAnalyst, raw: ansAnalyst }
    });

  } catch (error: any) {
    console.error("External API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
