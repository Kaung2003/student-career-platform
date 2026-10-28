import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { signAuthToken } from "../lib/jwt.js";
import { slugify, uniqueSlugFrom } from "../lib/slugify.js";
import { ensureBootstrapAdmin } from "../lib/admin.js";
import { HttpError, parse } from "../lib/http.js";
import { email, password, personName } from "../lib/schemas.js";
import { clearSessionCookie, setSessionCookie } from "../lib/session.js";
import { loginLimiter, signupLimiter } from "../lib/rate-limit.js";
import { appUrl, sendEmail } from "../lib/email.js";

export const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export const authRouter = Router();

type PublicUser = { id: string; name: string; email: string; role: string };

function toPublicUser(user: PublicUser) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function startSession(req: Parameters<typeof setSessionCookie>[0], res: Parameters<typeof setSessionCookie>[1], user: PublicUser) {
  setSessionCookie(req, res, signAuthToken({ userId: user.id, role: user.role }));
}

function findUserByEmail(address: string) {
  // Older accounts may have been stored with capital letters.
  return prisma.user.findFirst({ where: { email: { equals: address, mode: "insensitive" } } });
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const registerSchema = z.object({
  name: personName,
  email,
  password,
  role: z.enum(["STUDENT", "EMPLOYER"]).optional(),
});

authRouter.post("/register", signupLimiter, async (req, res) => {
  const body = parse(registerSchema, req.body);

  if (await findUserByEmail(body.email)) {
    throw new HttpError(409, "An account with that email already exists");
  }

  const created = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: await bcrypt.hash(body.password, SALT_ROUNDS),
      ...(body.role ? { role: body.role } : {}),
    },
  });
  const user = await ensureBootstrapAdmin(created);

  const slug = await uniqueSlugFrom(slugify(user.name));
  await prisma.studentProfile.create({ data: { userId: user.id, slug } });

  startSession(req, res, user);
  res.status(201).json({ user: toPublicUser(user) });
});

const loginSchema = z.object({ email: z.string().trim().min(1), password: z.string().min(1) });

authRouter.post("/login", loginLimiter, async (req, res) => {
  const body = parse(loginSchema, req.body);

  const found = await findUserByEmail(body.email);
  const passwordMatches = found ? await bcrypt.compare(body.password, found.password) : false;

  if (!found || !passwordMatches) {
    throw new HttpError(401, "Invalid email or password");
  }

  if (found.suspended) {
    throw new HttpError(403, "This account has been suspended. Contact support for help.");
  }

  const user = await ensureBootstrapAdmin(found);
  startSession(req, res, user);
  res.json({ user: toPublicUser(user) });
});

authRouter.post("/logout", (req, res) => {
  clearSessionCookie(req, res);
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const found = await prisma.user.findUnique({ where: { id: req.auth!.userId } });

  if (!found) {
    throw new HttpError(404, "User not found");
  }

  const user = await ensureBootstrapAdmin(found);

  // Clients that signed in before cookies existed send their token as a header; move them to the cookie.
  if (req.authVia === "bearer") {
    startSession(req, res, user);
  }

  res.json(toPublicUser(user));
});

authRouter.post("/forgot-password", signupLimiter, async (req, res) => {
  const body = parse(z.object({ email: z.string().trim().max(254) }), req.body);
  const user = body.email ? await findUserByEmail(body.email) : null;

  if (user && !user.suspended) {
    const token = randomBytes(32).toString("base64url");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });

    const link = `${appUrl()}/reset-password?token=${token}`;
    try {
      await sendEmail(
        user.email,
        "Reset your Student Career Platform password",
        `Hi ${user.name},\n\nSomeone asked to reset the password for your account. Open this link within one hour to choose a new password:\n\n${link}\n\nIf you didn't ask for this, you can ignore this email — your password won't change.`,
      );
    } catch (err) {
      console.error("Failed to send password reset email", err);
    }
  }

  // Same answer whether or not the account exists, so this can't be used to discover emails.
  res.json({ ok: true });
});

authRouter.post("/reset-password", signupLimiter, async (req, res) => {
  const body = parse(z.object({ token: z.string().min(20).max(200), password }), req.body);

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(body.token) } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new HttpError(400, "This reset link is invalid or has expired. Request a new one.");
  }

  const hashed = await bcrypt.hash(body.password, SALT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Any other outstanding links stop working once the password changes.
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null, id: { not: record.id } } }),
  ]);

  res.json({ ok: true });
});
