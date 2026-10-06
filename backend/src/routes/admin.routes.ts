import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

const ROLES = ["STUDENT", "EMPLOYER", "ADMIN"] as const;
const FEEDBACK_STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED"] as const;
const FEEDBACK_TYPES = ["BUG", "FEATURE", "COMMENT"] as const;
const CATEGORIES = ["BEHAVIORAL", "TECHNICAL", "SITUATIONAL"] as const;

function oneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

const DAY = 24 * 60 * 60 * 1000;

// ---------- Overview ----------

adminRouter.get("/stats", async (_req, res) => {
  const now = Date.now();
  const since14 = new Date(now - 13 * DAY);
  since14.setHours(0, 0, 0, 0);
  const since7 = new Date(now - 7 * DAY);

  const [users, newUsers, admins, suspended, projects, certifications, attempts, openFeedback, comments, questions, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since7 } } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { suspended: true } }),
      prisma.project.count(),
      prisma.certification.count(),
      prisma.interviewAttempt.count(),
      prisma.feedback.count({ where: { status: { not: "RESOLVED" } } }),
      prisma.comment.count(),
      prisma.interviewQuestion.count(),
      prisma.user.findMany({ where: { createdAt: { gte: since14 } }, select: { createdAt: true } }),
    ]);

  const signups: { date: string; count: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const day = new Date(since14.getTime() + i * DAY);
    signups.push({ date: day.toISOString().slice(0, 10), count: 0 });
  }
  for (const u of recentUsers) {
    const key = new Date(u.createdAt);
    key.setHours(0, 0, 0, 0);
    const bucket = signups.find((s) => s.date === key.toISOString().slice(0, 10));
    if (bucket) bucket.count += 1;
  }

  const [latestUsers, latestFeedback] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.feedback.findMany({
      where: { status: { not: "RESOLVED" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
  ]);

  res.json({
    totals: { users, newUsers, admins, suspended, projects, certifications, attempts, openFeedback, comments, questions },
    signups,
    latestUsers,
    latestFeedback: latestFeedback.map((f) => ({
      id: f.id,
      type: f.type,
      status: f.status,
      message: f.message,
      createdAt: f.createdAt,
      userName: f.user.name,
    })),
  });
});

// ---------- Users ----------

adminRouter.get("/users", async (req, res) => {
  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";
  const role = req.query["role"];
  const status = req.query["status"];

  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    ...(oneOf(ROLES, role) ? { role } : {}),
    ...(status === "suspended" ? { suspended: true } : status === "active" ? { suspended: false } : {}),
  };

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      suspended: true,
      createdAt: true,
      profile: { select: { slug: true, school: true, _count: { select: { projects: true } } } },
      _count: { select: { certifications: true, interviewAttempts: true, comments: true } },
    },
  });

  res.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      suspended: u.suspended,
      createdAt: u.createdAt,
      slug: u.profile?.slug ?? null,
      school: u.profile?.school ?? null,
      projects: u.profile?._count.projects ?? 0,
      certifications: u._count.certifications,
      attempts: u._count.interviewAttempts,
      comments: u._count.comments,
    })),
  });
});

adminRouter.patch("/users/:id", async (req, res) => {
  const id = req.params["id"] as string;
  const { role, suspended } = req.body ?? {};

  if (id === req.auth!.userId) {
    res.status(400).json({ error: "You can't change your own role or status." });
    return;
  }

  if (role !== undefined && !oneOf(ROLES, role)) {
    res.status(400).json({ error: `role must be one of: ${ROLES.join(", ")}` });
    return;
  }

  if (suspended !== undefined && typeof suspended !== "boolean") {
    res.status(400).json({ error: "suspended must be a boolean" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { ...(role !== undefined ? { role } : {}), ...(suspended !== undefined ? { suspended } : {}) },
    select: { id: true, role: true, suspended: true },
  });

  res.json({ user });
});

adminRouter.delete("/users/:id", async (req, res) => {
  const id = req.params["id"] as string;

  if (id === req.auth!.userId) {
    res.status(400).json({ error: "You can't delete your own account from the admin panel." });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await prisma.user.delete({ where: { id } });
  res.status(204).send();
});

// ---------- Feedback ----------

adminRouter.get("/feedback", async (req, res) => {
  const { status, type } = req.query;

  const feedback = await prisma.feedback.findMany({
    where: {
      ...(oneOf(FEEDBACK_STATUSES, status) ? { status } : {}),
      ...(oneOf(FEEDBACK_TYPES, type) ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { name: true, email: true } } },
  });

  const counts = await prisma.feedback.groupBy({ by: ["status"], _count: { _all: true } });

  res.json({
    feedback: feedback.map((f) => ({
      id: f.id,
      type: f.type,
      status: f.status,
      message: f.message,
      createdAt: f.createdAt,
      userName: f.user.name,
      userEmail: f.user.email,
    })),
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
  });
});

adminRouter.patch("/feedback/:id", async (req, res) => {
  const { status } = req.body ?? {};

  if (!oneOf(FEEDBACK_STATUSES, status)) {
    res.status(400).json({ error: `status must be one of: ${FEEDBACK_STATUSES.join(", ")}` });
    return;
  }

  const existing = await prisma.feedback.findUnique({ where: { id: req.params["id"] as string } });
  if (!existing) {
    res.status(404).json({ error: "Feedback not found" });
    return;
  }

  const feedback = await prisma.feedback.update({ where: { id: existing.id }, data: { status } });
  res.json({ feedback });
});

adminRouter.delete("/feedback/:id", async (req, res) => {
  const existing = await prisma.feedback.findUnique({ where: { id: req.params["id"] as string } });
  if (!existing) {
    res.status(404).json({ error: "Feedback not found" });
    return;
  }

  await prisma.feedback.delete({ where: { id: existing.id } });
  res.status(204).send();
});

// ---------- Interview questions ----------

function parseQuestion(body: unknown): { category: (typeof CATEGORIES)[number]; prompt: string; tip: string | null } | string {
  const { category, prompt, tip } = (body ?? {}) as Record<string, unknown>;
  if (!oneOf(CATEGORIES, category)) return `category must be one of: ${CATEGORIES.join(", ")}`;
  if (typeof prompt !== "string" || prompt.trim().length < 5) return "prompt is required";
  if (tip !== undefined && tip !== null && typeof tip !== "string") return "tip must be a string";
  return { category, prompt: prompt.trim(), tip: typeof tip === "string" && tip.trim() ? tip.trim() : null };
}

adminRouter.get("/questions", async (_req, res) => {
  const questions = await prisma.interviewQuestion.findMany({
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { attempts: true } } },
  });

  res.json({
    questions: questions.map((q) => ({
      id: q.id,
      category: q.category,
      prompt: q.prompt,
      tip: q.tip,
      createdAt: q.createdAt,
      attempts: q._count.attempts,
    })),
  });
});

adminRouter.post("/questions", async (req, res) => {
  const data = parseQuestion(req.body);
  if (typeof data === "string") {
    res.status(400).json({ error: data });
    return;
  }

  const question = await prisma.interviewQuestion.create({ data });
  res.status(201).json({ question });
});

adminRouter.put("/questions/:id", async (req, res) => {
  const data = parseQuestion(req.body);
  if (typeof data === "string") {
    res.status(400).json({ error: data });
    return;
  }

  const existing = await prisma.interviewQuestion.findUnique({ where: { id: req.params["id"] as string } });
  if (!existing) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const question = await prisma.interviewQuestion.update({ where: { id: existing.id }, data });
  res.json({ question });
});

adminRouter.delete("/questions/:id", async (req, res) => {
  const existing = await prisma.interviewQuestion.findUnique({ where: { id: req.params["id"] as string } });
  if (!existing) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  await prisma.interviewQuestion.delete({ where: { id: existing.id } });
  res.status(204).send();
});

// ---------- Comment moderation ----------

adminRouter.get("/comments", async (req, res) => {
  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";

  const comments = await prisma.comment.findMany({
    where: q ? { body: { contains: q, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      author: { select: { id: true, name: true, email: true } },
      profile: { select: { slug: true, user: { select: { name: true } } } },
    },
  });

  res.json({
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      authorId: c.author.id,
      authorName: c.author.name,
      authorEmail: c.author.email,
      profileSlug: c.profile.slug,
      profileName: c.profile.user.name,
    })),
  });
});

adminRouter.delete("/comments/:id", async (req, res) => {
  const existing = await prisma.comment.findUnique({ where: { id: req.params["id"] as string } });
  if (!existing) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  await prisma.comment.delete({ where: { id: existing.id } });
  res.status(204).send();
});
