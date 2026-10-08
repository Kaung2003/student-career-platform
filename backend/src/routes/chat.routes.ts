import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { complete, isAiConfigured, languageInstruction } from "../lib/ai.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

const SYSTEM_PROMPT = `You are Career Assistant, a friendly and knowledgeable career advisor built into Career Platform, a tool students use to build their portfolio and prepare for job applications.

Help with resumes, cover letters, project write-ups, interview preparation, certifications, job search strategy, and general career questions. Be practical, specific, and encouraging. Prefer short paragraphs and bullet lists; use **bold** for key points. Ask a clarifying question when a request is ambiguous. Use the student's profile below for context when relevant, but never invent facts about them.`;

const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 4000;

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

  const { message, history, language } = req.body ?? {};

  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `message must be at most ${MAX_MESSAGE_LENGTH} characters` });
    return;
  }

  if (history !== undefined && (!Array.isArray(history) || !history.every(isChatMessage))) {
    res.status(400).json({ error: "history must be an array of { role, content } messages" });
    return;
  }

  const system = (await buildSystemPrompt(req.auth!.userId)) + languageInstruction(language);
  const recentHistory = ((history as ChatMessage[] | undefined) ?? []).slice(-MAX_HISTORY);
  // Gemini requires the conversation to start with a user turn.
  while (recentHistory[0]?.role === "assistant") recentHistory.shift();

  try {
    const reply = await complete(system, [...recentHistory, { role: "user", content: message }]);
    res.json({ reply });
  } catch (err) {
    console.error("Chat request failed:", err);
    res.status(502).json({ error: "Failed to reach the AI assistant. Try again in a moment." });
  }
});

const IMPROVE_PROMPTS = {
  headline:
    "Rewrite the student's portfolio headline so it is professional, specific, and under 100 characters. Reply with only the headline, no quotes or commentary.",
  bio: "Rewrite the student's portfolio bio in the first person so it is professional, warm, and concise (3-5 sentences). Keep every fact they gave and do not invent new ones. Reply with only the bio text.",
  project:
    "Rewrite this portfolio project description so it is clear and compelling for recruiters: what it does, how it was built, and the impact or what was learned (2-4 sentences). Do not invent facts. Reply with only the description.",
} as const;

type ImproveKind = keyof typeof IMPROVE_PROMPTS;

chatRouter.post("/improve", async (req, res) => {
  if (!isAiConfigured()) {
    res.status(503).json({ error: "AI assistant is not configured on this server." });
    return;
  }

  const { kind, text, context, language } = req.body ?? {};

  if (typeof kind !== "string" || !(kind in IMPROVE_PROMPTS)) {
    res.status(400).json({ error: `kind must be one of: ${Object.keys(IMPROVE_PROMPTS).join(", ")}` });
    return;
  }

  if (typeof text !== "string" || text.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const details = typeof context === "string" ? context.slice(0, 1000) : "";
  const system = `${IMPROVE_PROMPTS[kind as ImproveKind]}\n\n${await buildSystemPrompt(req.auth!.userId, false)}${languageInstruction(language)}`;
  const input = text.trim()
    ? `${details ? `Context: ${details}\n\n` : ""}Current text:\n${text}`
    : `${details ? `Context: ${details}\n\n` : ""}The student hasn't written anything yet. Draft one from their profile.`;

  try {
    const suggestion = await complete(system, [{ role: "user", content: input }]);
    res.json({ suggestion: suggestion.trim() });
  } catch (err) {
    console.error("Improve request failed:", err);
    res.status(502).json({ error: "Failed to reach the AI assistant. Try again in a moment." });
  }
});

async function buildSystemPrompt(userId: string, includeAssistantPrompt = true): Promise<string> {
  const [user, profile, certifications] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.studentProfile.findUnique({ where: { userId }, include: { projects: true } }),
    prisma.certification.findMany({ where: { userId }, select: { name: true, status: true } }),
  ]);

  const contextLines: string[] = [];
  if (user) contextLines.push(`Name: ${user.name}`);
  if (profile) {
    if (profile.headline) contextLines.push(`Headline: ${profile.headline}`);
    if (profile.school) contextLines.push(`School: ${profile.school}${profile.gradYear ? ` (class of ${profile.gradYear})` : ""}`);
    if (profile.bio) contextLines.push(`Bio: ${profile.bio}`);
    if (profile.skills.length > 0) contextLines.push(`Skills: ${profile.skills.join(", ")}`);
    if (profile.projects.length > 0) {
      contextLines.push(
        `Projects: ${profile.projects
          .map((p) => `${p.title} (${p.techStack.join(", ")})${p.description ? ` - ${p.description}` : ""}`)
          .join("; ")}`,
      );
    }
  }

  if (certifications.length > 0) {
    contextLines.push(
      `Certifications: ${certifications.map((c) => `${c.name} (${c.status.toLowerCase().replace("_", " ")})`).join("; ")}`,
    );
  }

  const profileText =
    contextLines.length > 1 ? `Student profile:\n${contextLines.join("\n")}` : "The student hasn't filled in their profile yet.";

  return includeAssistantPrompt ? `${SYSTEM_PROMPT}\n\n${profileText}` : profileText;
}
