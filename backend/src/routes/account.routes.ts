import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { HttpError, parse } from "../lib/http.js";
import { password, personName } from "../lib/schemas.js";
import { clearSessionCookie } from "../lib/session.js";
import { SALT_ROUNDS, toPublicUser } from "./auth.routes.js";

export const accountRouter = Router();

accountRouter.use(requireAuth);

async function checkPassword(userId: string, candidate: string | undefined) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.password || !candidate || !(await bcrypt.compare(candidate, user.password))) {
    throw new HttpError(400, "Your current password is incorrect");
  }
  return user;
}

accountRouter.patch("/", async (req, res) => {
  const body = parse(z.object({ name: personName }), req.body);
  const user = await prisma.user.update({ where: { id: req.auth!.userId }, data: { name: body.name } });
  res.json({ user: toPublicUser(user) });
});

accountRouter.post("/password", async (req, res) => {
  const body = parse(z.object({ currentPassword: z.string().optional(), newPassword: password }), req.body);
  const current = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });
  // Google-only accounts have no password yet and may set one; everyone else must prove the old one.
  if (current.password) {
    await checkPassword(current.id, body.currentPassword);
  }

  await prisma.user.update({
    where: { id: req.auth!.userId },
    data: { password: await bcrypt.hash(body.newPassword, SALT_ROUNDS) },
  });
  res.json({ ok: true });
});

/** Everything we store about the user, as a downloadable JSON file. */
accountRouter.get("/export", async (req, res) => {
  const userId = req.auth!.userId;
  const [user, profile, certifications, attempts, feedback, comments, conversations] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.studentProfile.findUnique({ where: { userId }, include: { projects: true } }),
    prisma.certification.findMany({ where: { userId } }),
    prisma.interviewAttempt.findMany({ where: { userId }, include: { question: { select: { prompt: true } } } }),
    prisma.feedback.findMany({ where: { userId } }),
    prisma.comment.findMany({ where: { authorId: userId } }),
    prisma.chatConversation.findMany({ where: { userId }, include: { messages: { orderBy: { createdAt: "asc" } } } }),
  ]);

  res.setHeader("Content-Disposition", `attachment; filename="career-platform-data-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({
    exportedAt: new Date().toISOString(),
    user,
    profile,
    certifications,
    interviewAttempts: attempts,
    feedback,
    commentsWritten: comments,
    chatConversations: conversations,
  });
});

accountRouter.delete("/", async (req, res) => {
  const body = parse(z.object({ password: z.string().optional(), confirmEmail: z.string().optional() }), req.body);
  const account = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });
  // Accounts with a password confirm with it; Google-only accounts confirm by typing their email.
  if (account.password) {
    await checkPassword(account.id, body.password);
  } else if (body.confirmEmail?.trim().toLowerCase() !== account.email.toLowerCase()) {
    throw new HttpError(400, "Type your email address exactly to confirm");
  }
  const user = account;

  if (user.role === "ADMIN" && (await prisma.user.count({ where: { role: "ADMIN" } })) === 1) {
    throw new HttpError(400, "You're the only admin. Make someone else an admin before deleting your account.");
  }

  // Profile, projects, certifications, practice, chats and comments are removed by cascading deletes.
  await prisma.user.delete({ where: { id: user.id } });
  clearSessionCookie(req, res);
  res.status(204).send();
});
