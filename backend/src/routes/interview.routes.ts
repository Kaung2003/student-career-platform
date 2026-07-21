import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { complete, isAiConfigured } from "../lib/ai.js";

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

interviewRouter.post("/practice", async (req, res) => {
  const { questionId, answer } = req.body ?? {};

  if (typeof questionId !== "string" || typeof answer !== "string" || answer.trim().length === 0) {
    res.status(400).json({ error: "questionId and answer are required" });
    return;
  }

  const question = await prisma.interviewQuestion.findUnique({ where: { id: questionId } });
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
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
      "You are an interview coach. Give the candidate direct, specific feedback on their practice answer: what worked, what to improve, and one concrete suggestion to strengthen it. Keep it to a short paragraph.",
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
