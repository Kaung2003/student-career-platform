import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env["GEMINI_MODEL"] || "gemini-flash-latest";

let client: GoogleGenerativeAI | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env["GEMINI_API_KEY"]);
}

function getClient(): GoogleGenerativeAI {
  if (!client) {
    client = new GoogleGenerativeAI(process.env["GEMINI_API_KEY"]!);
  }
  return client;
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export async function complete(system: string, messages: AiMessage[]): Promise<string> {
  const model = getClient().getGenerativeModel({ model: MODEL, systemInstruction: system });

  const result = await model.generateContent({
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });

  return result.response.text();
}
