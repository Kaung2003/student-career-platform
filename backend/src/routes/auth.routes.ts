import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { Router, type Request, type Response } from "express";
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
import { appUrl, isEmailConfigured, sendEmail } from "../lib/email.js";
import { googleClientId, verifyGoogleCredential } from "../lib/google.js";

export const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const authRouter = Router();

type SessionUser = { id: string; name: string; email: string; role: string; password?: string | null };

export function toPublicUser(user: SessionUser) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, hasPassword: Boolean(user.password) };
}

function startSession(req: Request, res: Response, user: SessionUser) {
  setSessionCookie(req, res, signAuthToken({ userId: user.id, role: user.role }));
}

function findUserByEmail(address: string) {
  // Older accounts may have been stored with capital letters.
  return prisma.user.findFirst({ where: { email: { equals: address, mode: "insensitive" } } });
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function createProfile(userId: string, name: string) {
  const slug = await uniqueSlugFrom(slugify(name));
  await prisma.studentProfile.create({ data: { userId, slug } });
}

/** Emails a fresh one-day verification link (older unused links stop working). */
async function sendVerificationEmail(user: { id: string; name: string; email: string }) {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
    prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS) },
    }),
  ]);

  const link = `${appUrl()}/verify-email?token=${token}`;
  try {
    await sendEmail(
      user.email,
      "Confirm your email for Student Career Platform",
      `Hi ${user.name},\n\nWelcome to Student Career Platform! Please confirm your email address by opening this link within 24 hours:\n\n${link}\n\nIf you didn't create an account, you can ignore this email.`,
    );
  } catch (err) {
    console.error("Failed to send verification email", err);
  }
}

/** Public settings the login and sign-up pages need. */
authRouter.get("/config", (_req, res) => {
  res.json({ googleClientId: googleClientId(), emailConfigured: isEmailConfigured() });
});

const registerSchema = z.object({
  name: personName,
  email,
  password,
  role: z.enum(["STUDENT", "EMPLOYER"]).optional(),
});

/** Password sign-up: the account can't log in until the emailed link is clicked. */
authRouter.post("/register", signupLimiter, async (req, res) => {
  const body = parse(registerSchema, req.body);

  if (await findUserByEmail(body.email)) {
    throw new HttpError(409, "An account with that email already exists. Log in, or use “Sign in with Google”.");
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: await bcrypt.hash(body.password, SALT_ROUNDS),
      ...(body.role ? { role: body.role } : {}),
    },
  });
  await createProfile(user.id, user.name);
  await sendVerificationEmail(user);

  res.status(201).json({ verificationRequired: true, email: user.email });
});

/** Confirms the email from the link and logs the user straight in. */
authRouter.post("/verify-email", signupLimiter, async (req, res) => {
  const body = parse(z.object({ token: z.string().min(20).max(200) }), req.body);

  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(body.token) } });
  if (!record || record.expiresAt < new Date()) {
    throw new HttpError(400, "This confirmation link is invalid or has expired. Request a new one.", "VERIFY_LINK_INVALID");
  }

  const [verified] = await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  if (verified.suspended) {
    throw new HttpError(403, "This account has been suspended. Contact support for help.");
  }

  const user = await ensureBootstrapAdmin(verified);
  startSession(req, res, user);
  res.json({ user: toPublicUser(user) });
});

authRouter.post("/resend-verification", signupLimiter, async (req, res) => {
  const body = parse(z.object({ email: z.string().trim().max(254) }), req.body);
  const user = body.email ? await findUserByEmail(body.email) : null;

  if (user && !user.emailVerified && !user.suspended) {
    await sendVerificationEmail(user);
  }

  // Same answer either way, so this can't be used to discover which emails have accounts.
  res.json({ ok: true });
});

const loginSchema = z.object({ email: z.string().trim().min(1), password: z.string().min(1) });

authRouter.post("/login", loginLimiter, async (req, res) => {
  const body = parse(loginSchema, req.body);

  const found = await findUserByEmail(body.email);
  const passwordMatches = found?.password ? await bcrypt.compare(body.password, found.password) : false;

  if (!found || !passwordMatches) {
    if (found && !found.password) {
      throw new HttpError(401, "This account uses Google. Click “Sign in with Google”.", "USE_GOOGLE");
    }
    throw new HttpError(401, "Invalid email or password");
  }

  if (found.suspended) {
    throw new HttpError(403, "This account has been suspended. Contact support for help.");
  }

  if (!found.emailVerified) {
    throw new HttpError(403, "Please confirm your email first. Check your inbox for the link.", "EMAIL_NOT_VERIFIED");
  }

  const user = await ensureBootstrapAdmin(found);
  startSession(req, res, user);
  res.json({ user: toPublicUser(user) });
});

/** "Sign in with Google": verifies Google's ID token, then logs in, links, or creates the account. */
authRouter.post("/google", signupLimiter, async (req, res) => {
  if (!googleClientId()) {
    throw new HttpError(503, "Google sign-in isn't set up on this server yet.");
  }

  const body = parse(z.object({ credential: z.string().min(20).max(5000) }), req.body);

  let identity;
  try {
    identity = await verifyGoogleCredential(body.credential);
  } catch {
    identity = null;
  }
  if (!identity) {
    throw new HttpError(401, "Google sign-in failed. Please try again.");
  }

  let found = await prisma.user.findUnique({ where: { googleId: identity.googleId } });

  if (!found) {
    const byEmail = await findUserByEmail(identity.email);
    if (byEmail) {
      // Same email as an existing account: Google has proven ownership, so link them.
      found = await prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: identity.googleId, emailVerified: byEmail.emailVerified ?? new Date() },
      });
    } else {
      found = await prisma.user.create({
        data: { name: identity.name, email: identity.email, googleId: identity.googleId, emailVerified: new Date() },
      });
      await createProfile(found.id, found.name);
    }
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
    // Receiving the reset email also proves the address is real.
    prisma.user.update({ where: { id: record.userId }, data: { password: hashed, emailVerified: new Date() } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Any other outstanding links stop working once the password changes.
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null, id: { not: record.id } } }),
  ]);

  res.json({ ok: true });
});
