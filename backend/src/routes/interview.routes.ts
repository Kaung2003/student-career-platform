import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { complete, isAiConfigured, languageInstruction } from "../lib/ai.js";
import { HttpError, parse } from "../lib/http.js";
import { aiLanguage } from "../lib/schemas.js";
import { aiLimiter } from "../lib/rate-limit.js";

export const interviewRouter = Router();

interviewRouter.use(requireAuth);

const CATEGORIES = ["BEHAVIORAL", "TECHNICAL", "SITUATIONAL"] as const;
type Category = (typeof CATEGORIES)[number];

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

interviewRouter.get("/status", (_req, res) => {
  res.json({ configured: isAiConfigured() });
});

interviewRouter.get("/questions", async (req, res) => {
  const category = req.query["category"];

  const questions = await prisma.interviewQuestion.findMany({
    where: { ...(isCategory(category) ? { category } : {}) },
    orderBy: { createdAt: "asc" },
  });

  res.json({ questions });
});

interviewRouter.get("/attempts", async (req, res) => {
  const attempts = await prisma.interviewAttempt.findMany({
    where: { userId: req.auth!.userId },
    include: { question: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  res.json({ attempts });
});

const practiceSchema = z.object({
  questionId: z.string().min(1).max(40),
  answer: z.string().trim().min(1, "is required").max(6000, "must be at most 6000 characters"),
  language: aiLanguage,
});

interviewRouter.post("/practice", aiLimiter, async (req, res) => {
  const { questionId, answer, language } = parse(practiceSchema, req.body);

  const question = await prisma.interviewQuestion.findUnique({ where: { id: questionId } });
  if (!question) {
    throw new HttpError(404, "Question not found");
  }

  if (!isAiConfigured()) {
    const attempt = await prisma.interviewAttempt.create({
      data: { questionId, answer, feedback: null, userId: req.auth!.userId },
    });
    res.json({ attempt, feedback: null });
    return;
  }

  try {
    const feedback = await complete(
      "You are an interview coach. Give the candidate direct, specific feedback on their practice answer. Format it in Markdown with exactly these sections: a first line `**Score: N/10**`, then `**What worked**` (1-3 bullets), `**What to improve**` (1-3 bullets), and `**Try this**` (one concrete rewrite suggestion). Keep it concise. If you write in another language, keep the first line exactly as `**Score: N/10**` and translate only the section headings and feedback." + languageInstruction(language),
      [
        {
          role: "user",
          content: `Interview question (${question.category.toLowerCase()}): ${question.prompt}\n\nCandidate's answer:\n${answer}`,
        },
      ],
    );

    const attempt = await prisma.interviewAttempt.create({
      data: { questionId, answer, feedback, userId: req.auth!.userId },
    });

    res.json({ attempt, feedback });
  } catch (err) {
    console.error("Interview feedback request failed:", err);
    res.status(502).json({ error: "Failed to reach the AI assistant. Try again in a moment." });
  }
});
