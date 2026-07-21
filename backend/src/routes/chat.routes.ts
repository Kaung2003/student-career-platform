import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { complete, isAiConfigured } from "../lib/ai.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

const SYSTEM_PROMPT = `You are a career advisor embedded in Career Platform, a tool students use to build their portfolio and prepare for job applications. Help with resume and project feedback, interview preparation, and general career advice. Be concise, practical, and specific. Use the student's profile and projects below for context when relevant.`;

chatRouter.get("/status", (_req, res) => {
  res.json({ configured: isAiConfigured() });
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (v["role"] === "user" || v["role"] === "assistant") && typeof v["content"] === "string";
}

chatRouter.post("/message", async (req, res) => {
  if (!isAiConfigured()) {
    res.status(503).json({ error: "AI assistant is not configured on this server." });
    return;
  }

  const { message, history } = req.body ?? {};

  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  if (history !== undefined && (!Array.isArray(history) || !history.every(isChatMessage))) {
    res.status(400).json({ error: "history must be an array of { role, content } messages" });
    return;
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: req.auth!.userId },
    include: { projects: true },
  });

  const contextLines = [];
  if (profile) {
    if (profile.headline) contextLines.push(`Headline: ${profile.headline}`);
    if (profile.school) contextLines.push(`School: ${profile.school}`);
    if (profile.skills.length > 0) contextLines.push(`Skills: ${profile.skills.join(", ")}`);
    if (profile.projects.length > 0) {
      contextLines.push(
        `Projects: ${profile.projects.map((p) => `${p.title} (${p.techStack.join(", ")})`).join("; ")}`,
      );
    }
  }

  const system =
    contextLines.length > 0
      ? `${SYSTEM_PROMPT}\n\nStudent profile:\n${contextLines.join("\n")}`
      : `${SYSTEM_PROMPT}\n\nThe student hasn't set up their profile yet.`;

  try {
    const reply = await complete(system, [...((history as ChatMessage[]) ?? []), { role: "user", content: message }]);
    res.json({ reply });
  } catch (err) {
    console.error("Chat request failed:", err);
    res.status(502).json({ error: "Failed to reach the AI assistant. Try again in a moment." });
  }
});
