import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/http.js";

export const feedbackRouter = Router();

feedbackRouter.use(requireAuth);

const feedbackSchema = z.object({
  type: z.enum(["BUG", "FEATURE", "COMMENT"]),
  message: z.string().trim().min(1, "is required").max(5000, "must be at most 5000 characters"),
});

feedbackRouter.post("/", async (req, res) => {
  const body = parse(feedbackSchema, req.body);
  const feedback = await prisma.feedback.create({ data: { ...body, userId: req.auth!.userId } });
  res.status(201).json({ feedback });
});
