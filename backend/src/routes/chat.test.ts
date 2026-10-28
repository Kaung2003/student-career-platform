import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase, signUp } from "../test/helpers.js";

vi.mock("../lib/ai.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/ai.js")>()),
  isAiConfigured: () => true,
  complete: async () => "A sharper headline",
  stream: async (_system: string, _messages: unknown[], onDelta: (text: string) => void) => {
    onDelta("Hello ");
    onDelta("there!");
    return "Hello there!";
  },
}));

beforeEach(resetDatabase);

function parseEvents(raw: string) {
  return raw
    .trim()
    .split("\n\n")
    .map((block) => {
      const event = /^event: (.+)$/m.exec(block)?.[1];
      const data = /^data: (.+)$/m.exec(block)?.[1];
      return { event, data: data ? JSON.parse(data) : null };
    });
}

describe("chat assistant", () => {
  it("streams a reply and saves the conversation to the account", async () => {
    const { agent } = await signUp();

    const res = await agent.post("/api/chat/stream").send({ message: "How do I prepare for interviews?" }).buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);

    const events = parseEvents(res.text);
    expect(events.map((e) => e.event)).toEqual(["meta", "delta", "delta", "done"]);
    const conversationId = events[0]!.data.conversationId;

    const saved = await agent.get(`/api/chat/conversations/${conversationId}`);
    expect(saved.body.messages.map((m: { role: string; content: string }) => [m.role, m.content])).toEqual([
      ["USER", "How do I prepare for interviews?"],
      ["ASSISTANT", "Hello there!"],
    ]);

    const list = await agent.get("/api/chat/conversations");
    expect(list.body.conversations).toHaveLength(1);
  });

  it("keeps conversations private to their owner", async () => {
    const owner = await signUp();
    const other = await signUp();

    const res = await owner.agent.post("/api/chat/stream").send({ message: "Hi" }).buffer(true);
    const conversationId = parseEvents(res.text)[0]!.data.conversationId;

    expect((await other.agent.get(`/api/chat/conversations/${conversationId}`)).status).toBe(404);
    expect((await other.agent.post("/api/chat/stream").send({ conversationId, message: "Hi" })).status).toBe(404);
  });

  it("returns AI writing suggestions", async () => {
    const { agent } = await signUp();
    const res = await agent.post("/api/chat/improve").send({ kind: "headline", text: "student" });
    expect(res.body.suggestion).toBe("A sharper headline");
  });
});
