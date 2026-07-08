import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type === "application/pdf") {
      const data = await pdfParse(buffer);
      return NextResponse.json({ text: data.text });
    } 

    if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
        return NextResponse.json({ text: buffer.toString("utf-8") });
    }

    return NextResponse.json({ error: "Unsupported file type. Please upload a PDF or text file." }, { status: 400 });

  } catch (err: any) {
    console.error("Upload API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
