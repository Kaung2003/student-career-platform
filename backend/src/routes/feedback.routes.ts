import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";

export const feedbackRouter = Router();

feedbackRouter.use(requireAuth);

const TYPES = ["BUG", "FEATURE", "COMMENT"] as const;
type FeedbackType = (typeof TYPES)[number];

function isFeedbackType(value: unknown): value is FeedbackType {
  return typeof value === "string" && (TYPES as readonly string[]).includes(value);
}

feedbackRouter.post("/", async (req, res) => {
  const { type, message } = req.body ?? {};

  if (!isFeedbackType(type)) {
    res.status(400).json({ error: `type must be one of: ${TYPES.join(", ")}` });
    return;
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const feedback = await prisma.feedback.create({
    data: { type, message: message.trim(), userId: req.auth!.userId },
  });

  res.status(201).json({ feedback });
});
