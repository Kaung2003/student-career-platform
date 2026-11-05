import { prisma } from "./prisma.js";
import { reportError } from "./monitoring.js";

const HOUR = 60 * 60 * 1000;
const FAILED_EMAIL_DAYS = 30;

/** Deletes data that has served its purpose: expired counters, old failed emails, expired links. */
export async function cleanUp() {
  const now = new Date();
  await prisma.rateLimitCounter.deleteMany({ where: { resetAt: { lt: now } } });
  await prisma.emailJob.deleteMany({ where: { failedAt: { lt: new Date(now.getTime() - FAILED_EMAIL_DAYS * 24 * HOUR) } } });
  await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } });
  await prisma.emailVerificationToken.deleteMany({ where: { expiresAt: { lt: now } } });
}

export function startCleanup() {
  setInterval(() => void cleanUp().catch((err) => reportError(err, { note: "Cleanup failed" })), HOUR).unref();
}
