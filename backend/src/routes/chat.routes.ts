import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { complete, isAiConfigured, languageInstruction, stream, type AiMessage } from "../lib/ai.js";
import { HttpError, parse } from "../lib/http.js";
import { aiLanguage } from "../lib/schemas.js";
import { aiLimiter } from "../lib/rate-limit.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

const SYSTEM_PROMPT = `You are Career Assistant, a friendly and knowledgeable career advisor built into Career Platform, a tool students use to build their portfolio and prepare for job applications.

Help with resumes, cover letters, project write-ups, interview preparation, certifications, job search strategy, and general career questions. Be practical, specific, and encouraging. Prefer short paragraphs and bullet lists; use **bold** for key points. Ask a clarifying question when a request is ambiguous. Use the student's profile below for context when relevant, but never invent facts about them.`;

const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONVERSATIONS = 100;

function requireAi() {
  if (!isAiConfigured()) {
    throw new HttpError(503, "AI assistant is not configured on this server.");
  }
}

function titleFrom(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean;
}

/** Gemini requires the conversation to start with a user turn. */
function trimHistory(history: AiMessage[]) {
  const recent = history.slice(-MAX_HISTORY);
  while (recent[0]?.role === "assistant") recent.shift();
  return recent;
}

chatRouter.get("/status", (_req, res) => {
  res.json({ configured: isAiConfigured() });
});

// ---------- Saved conversations ----------

chatRouter.get("/conversations", async (req, res) => {
  const conversations = await prisma.chatConversation.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { updatedAt: "desc" },
    take: MAX_CONVERSATIONS,
    select: { id: true, title: true, updatedAt: true },
  });
  res.json({ conversations });
});

async function ownConversationOr404(userId: string, id: string) {
  const conversation = await prisma.chatConversation.findUnique({ where: { id } });
  if (!conversation || conversation.userId !== userId) {
    throw new HttpError(404, "Conversation not found");
  }
  return conversation;
}

chatRouter.get("/conversations/:id", async (req, res) => {
  const conversation = await ownConversationOr404(req.auth!.userId, req.params["id"] as string);
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  });
  res.json({ conversation: { id: conversation.id, title: conversation.title, updatedAt: conversation.updatedAt }, messages });
});

chatRouter.delete("/conversations/:id", async (req, res) => {
  const conversation = await ownConversationOr404(req.auth!.userId, req.params["id"] as string);
  await prisma.chatConversation.delete({ where: { id: conversation.id } });
  res.status(204).send();
});

const streamSchema = z.object({
  conversationId: z.string().max(40).optional(),
  message: z.string().trim().min(1, "is required").max(MAX_MESSAGE_LENGTH),
  language: aiLanguage,
  /** Set when retrying: the user's last message is already saved, so don't store it twice. */
  retry: z.boolean().optional(),
});

function sse(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Sends a message and streams the reply as server-sent events:
 * `meta` (conversation id/title), many `delta` chunks, then `done` or `error`.
 */
chatRouter.post("/stream", aiLimiter, async (req, res) => {
  requireAi();
  const body = parse(streamSchema, req.body);
  const userId = req.auth!.userId;

  const conversation = body.conversationId
    ? await ownConversationOr404(userId, body.conversationId)
    : await prisma.chatConversation.create({ data: { userId, title: titleFrom(body.message) } });

  const previous = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });
  const history: AiMessage[] = previous.map((m) => ({ role: m.role === "USER" ? "user" : "assistant", content: m.content }));

  if (body.retry && history.at(-1)?.role === "user") {
    history.pop();
  } else {
    await prisma.chatMessage.create({ data: { conversationId: conversation.id, role: "USER", content: body.message } });
  }

  const system = (await buildSystemPrompt(userId)) + languageInstruction(body.language);

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  sse(res, "meta", { conversationId: conversation.id, title: conversation.title });

  try {
    const reply = await stream(system, trimHistory([...history, { role: "user", content: body.message }]), (text) =>
      sse(res, "delta", { text }),
    );
    await prisma.$transaction([
      prisma.chatMessage.create({ data: { conversationId: conversation.id, role: "ASSISTANT", content: reply } }),
      prisma.chatConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } }),
    ]);
    sse(res, "done", {});
  } catch (err) {
    console.error("Chat stream failed:", err);
    sse(res, "error", { error: "Failed to reach the AI assistant. Try again in a moment." });
  } finally {
    res.end();
  }
});

// ---------- One-off "Improve with AI" writing help ----------

const IMPROVE_PROMPTS = {
  headline:
    "Rewrite the student's portfolio headline so it is professional, specific, and under 100 characters. Reply with only the headline, no quotes or commentary.",
  bio: "Rewrite the student's portfolio bio in the first person so it is professional, warm, and concise (3-5 sentences). Keep every fact they gave and do not invent new ones. Reply with only the bio text.",
  project:
    "Rewrite this portfolio project description so it is clear and compelling for recruiters: what it does, how it was built, and the impact or what was learned (2-4 sentences). Do not invent facts. Reply with only the description.",
} as const;

const improveSchema = z.object({
  kind: z.enum(["headline", "bio", "project"]),
  text: z.string().max(MAX_MESSAGE_LENGTH),
  context: z.string().max(1000).optional(),
  language: aiLanguage,
});

chatRouter.post("/improve", aiLimiter, async (req, res) => {
  requireAi();
  const body = parse(improveSchema, req.body);

  const system = `${IMPROVE_PROMPTS[body.kind]}\n\n${await buildSystemPrompt(req.auth!.userId, false)}${languageInstruction(body.language)}`;
  const details = body.context ? `Context: ${body.context}\n\n` : "";
  const input = body.text.trim()
    ? `${details}Current text:\n${body.text}`
    : `${details}The student hasn't written anything yet. Draft one from their profile.`;

  try {
    const suggestion = await complete(system, [{ role: "user", content: input }]);
    res.json({ suggestion: suggestion.trim() });
  } catch (err) {
    console.error("Improve request failed:", err);
    throw new HttpError(502, "Failed to reach the AI assistant. Try again in a moment.");
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
