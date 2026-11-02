import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
let primaryBehaviour: "hang" | "overloaded" = "hang";

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel({ model }: { model: string }) {
      const call = () => {
        calls.push(model);
        if (model !== "backup") {
          return primaryBehaviour === "hang" ? new Promise(() => {}) : Promise.reject(new Error("503 high demand"));
        }
        return null;
      };
      return {
        generateContent: async () => (await call()) ?? { response: { text: () => "from backup" } },
        generateContentStream: async () =>
          (await call()) ?? {
            stream: (async function* () {
              yield { text: () => "from " };
              yield { text: () => "backup" };
            })(),
          },
      };
    }
  },
}));

vi.stubEnv("GEMINI_API_KEY", "test");
vi.stubEnv("GEMINI_MODEL", "primary");
vi.stubEnv("GEMINI_FALLBACK_MODELS", "backup");
vi.stubEnv("AI_TIMEOUT_MS", "30");
vi.stubEnv("AI_FIRST_CHUNK_TIMEOUT_MS", "30");
const { complete, stream } = await import("./ai.js");

const messages = [{ role: "user" as const, content: "hi" }];

beforeEach(() => {
  calls.length = 0;
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("AI fallback", () => {
  it("skips straight to the fallback when the primary model hangs", async () => {
    primaryBehaviour = "hang";
    const deltas: string[] = [];
    await expect(stream("sys", messages, (t) => deltas.push(t))).resolves.toBe("from backup");
    expect(deltas).toEqual(["from ", "backup"]);
    expect(calls).toEqual(["primary", "backup"]);

    calls.length = 0;
    await expect(complete("sys", messages)).resolves.toBe("from backup");
    expect(calls).toEqual(["primary", "backup"]);
  });

  it("retries an overloaded primary model once before falling back", async () => {
    primaryBehaviour = "overloaded";
    await expect(stream("sys", messages, () => {})).resolves.toBe("from backup");
    expect(calls).toEqual(["primary", "primary", "backup"]);
  });
});
