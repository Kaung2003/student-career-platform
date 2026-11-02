import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env["GEMINI_MODEL"] || "gemini-flash-latest";
// Tried in order when the primary model is overloaded or rate limited.
const FALLBACK_MODELS = (process.env["GEMINI_FALLBACK_MODELS"] ?? "gemini-flash-lite-latest")
  .split(",")
  .map((m) => m.trim())
  .filter((m) => m && m !== MODEL);

// Give up on a model call that hasn't answered after this long, then fall back. The hosting proxy
// cuts requests off at about 26 seconds, so a stuck model plus its fallback must fit inside that.
const REQUEST_TIMEOUT_MS = Number(process.env["AI_TIMEOUT_MS"] ?? 12_000);
// A streamed reply must start this quickly; a healthy model's first words arrive within seconds.
const FIRST_CHUNK_TIMEOUT_MS = Number(process.env["AI_FIRST_CHUNK_TIMEOUT_MS"] ?? 8_000);
// A streamed reply may take longer overall, as long as words keep arriving.
const STREAM_TOTAL_TIMEOUT_MS = 120_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`AI request timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

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
  return /\b(429|500|502|503|504)\b|overloaded|high demand|unavailable|timeout|timed out|abort|fetch failed/i.test(message);
}

const isTimeout = (err: unknown) => /timed out|timeout|abort/i.test(err instanceof Error ? err.message : String(err));

/** A model that hung won't recover in time, so skip its remaining retries and go straight to the fallback. */
function nextAttempt(attempts: string[], i: number, err: unknown): number {
  let next = i + 1;
  if (isTimeout(err)) {
    while (attempts[next] === attempts[i]) next++;
  }
  return next;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generate(model: string, system: string, messages: AiMessage[]): Promise<string> {
  const result = await withTimeout(
    getClient()
      .getGenerativeModel({ model, systemInstruction: system }, { timeout: REQUEST_TIMEOUT_MS })
      .generateContent({
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }),
    REQUEST_TIMEOUT_MS,
  );
  return result.response.text();
}

export async function complete(system: string, messages: AiMessage[]): Promise<string> {
  // Retry the primary model briefly, then fall back to lighter models on transient errors.
  const attempts = [MODEL, MODEL, ...FALLBACK_MODELS];
  let lastError: unknown;

  for (let i = 0; i < attempts.length; ) {
    const model = attempts[i]!;
    try {
      return await generate(model, system, messages);
    } catch (err) {
      lastError = err;
      if (!isTransient(err)) throw err;
      console.warn(`AI model ${model} failed (attempt ${i + 1}/${attempts.length}), retrying...`, err instanceof Error ? err.message : err);
      i = nextAttempt(attempts, i, err);
      if (i < attempts.length) await sleep(400);
    }
  }

  throw lastError;
}

/**
 * Streams a reply, calling onDelta for each chunk. Retries and falls back to lighter models
 * only if the failure happens before any text was sent, so the reader never sees a reply restart.
 */
export async function stream(
  system: string,
  messages: AiMessage[],
  onDelta: (text: string) => void,
): Promise<string> {
  const attempts = [MODEL, MODEL, ...FALLBACK_MODELS];
  let lastError: unknown;

  for (let i = 0; i < attempts.length; ) {
    const model = attempts[i]!;
    let full = "";
    try {
      // Only the start is time-boxed: once words flow, a long answer is fine.
      const started = (async () => {
        const result = await getClient()
          .getGenerativeModel({ model, systemInstruction: system }, { timeout: STREAM_TOTAL_TIMEOUT_MS })
          .generateContentStream({
            contents: messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          });
        const iterator = result.stream[Symbol.asyncIterator]();
        return { iterator, first: await iterator.next() };
      })();
      const { iterator, first } = await withTimeout(started, FIRST_CHUNK_TIMEOUT_MS);

      for (let next = first; !next.done; next = await iterator.next()) {
        const text = next.value.text();
        if (text) {
          full += text;
          onDelta(text);
        }
      }
      return full;
    } catch (err) {
      lastError = err;
      if (full || !isTransient(err)) throw err;
      console.warn(`AI model ${model} failed to stream (attempt ${i + 1}/${attempts.length}), retrying...`, err instanceof Error ? err.message : err);
      i = nextAttempt(attempts, i, err);
      if (i < attempts.length) await sleep(400);
    }
  }

  throw lastError;
}

const SUPPORTED_LANGUAGES = ["English", "Japanese", "Simplified Chinese", "Spanish", "German", "Burmese"];

/** System-prompt suffix asking the model to answer in the user's UI language (ignored if unknown). */
export function languageInstruction(language: unknown): string {
  if (typeof language !== "string" || !SUPPORTED_LANGUAGES.includes(language) || language === "English") return "";
  return `\n\nAlways write your entire response in ${language}, even if the user's text or the context above is in English. Keep proper nouns, technology names, and code unchanged.`;
}
