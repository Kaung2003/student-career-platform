import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env["GEMINI_MODEL"] || "gemini-flash-latest";
// Tried in order when the primary model is overloaded or rate limited.
const FALLBACK_MODELS = (process.env["GEMINI_FALLBACK_MODELS"] ?? "gemini-flash-lite-latest")
  .split(",")
  .map((m) => m.trim())
  .filter((m) => m && m !== MODEL);

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

function isTransient(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /\b(429|500|502|503|504)\b|overloaded|high demand|unavailable|timeout|fetch failed/i.test(message);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generate(model: string, system: string, messages: AiMessage[]): Promise<string> {
  const result = await getClient()
    .getGenerativeModel({ model, systemInstruction: system })
    .generateContent({
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

  return result.response.text();
}

export async function complete(system: string, messages: AiMessage[]): Promise<string> {
  // Retry the primary model briefly, then fall back to lighter models on transient errors.
  const attempts = [MODEL, MODEL, ...FALLBACK_MODELS];
  let lastError: unknown;

  for (const [i, model] of attempts.entries()) {
    try {
      return await generate(model, system, messages);
    } catch (err) {
      lastError = err;
      if (!isTransient(err)) throw err;
      console.warn(`AI model ${model} failed (attempt ${i + 1}/${attempts.length}), retrying...`);
      if (i < attempts.length - 1) await sleep(400 * (i + 1));
    }
  }

  throw lastError;
}
