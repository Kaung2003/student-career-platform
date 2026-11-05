import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { prisma } from "./prisma.js";
import { sendEmail } from "./email.js";
import { reportError } from "./monitoring.js";

const BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 30_000;
// How long a claimed email is left alone. If the server dies mid-send, it's retried after this.
const LEASE_MS = 2 * 60 * 1000;
/** Wait before each retry. One more failure after the last of these and the email is given up on. */
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000];

type Job = { id: string; to: string; subject: string; body: string; attempts: number };

function encryptionKey() {
  return createHash("sha256").update(`email-queue:${process.env["JWT_SECRET"]}`).digest();
}

export function encryptBody(text: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString("base64")).join(".");
}

function decryptBody(stored: string) {
  const [iv, tag, data] = stored.split(".").map((part) => Buffer.from(part, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv!);
  decipher.setAuthTag(tag!);
  return Buffer.concat([decipher.update(data!), decipher.final()]).toString("utf8");
}

/** Takes due emails for this server. SKIP LOCKED means two servers never send the same one. */
function claimBatch() {
  return prisma.$queryRaw<Job[]>`
    UPDATE "EmailJob"
    SET "attempts" = "attempts" + 1, "runAt" = ${new Date(Date.now() + LEASE_MS)}
    WHERE "id" IN (
      SELECT "id" FROM "EmailJob"
      WHERE "failedAt" IS NULL AND "runAt" <= ${new Date()}
      ORDER BY "runAt"
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING "id", "to", "subject", "body", "attempts"
  `;
}

async function deliver(job: Job) {
  try {
    await sendEmail(job.to, job.subject, decryptBody(job.body));
    await prisma.emailJob.deleteMany({ where: { id: job.id } });
  } catch (err) {
    const delay = RETRY_DELAYS_MS[job.attempts - 1];
    if (delay !== undefined) {
      await prisma.emailJob.updateMany({ where: { id: job.id }, data: { runAt: new Date(Date.now() + delay) } });
      console.warn(`Email ${job.id} failed (attempt ${job.attempts}), will retry`);
    } else {
      await prisma.emailJob.updateMany({ where: { id: job.id }, data: { failedAt: new Date(), body: "" } });
      reportError(err, { emailJobId: job.id, subject: job.subject, note: "Gave up on email after all retries" });
    }
  }
}

async function sendDueEmails() {
  for (;;) {
    const jobs = await claimBatch();
    if (jobs.length === 0) return;
    await Promise.all(jobs.map(deliver));
  }
}

let current: Promise<void> = Promise.resolve();

/** Sends everything that's due, after any run already in progress. Resolves when it has finished. */
export function drainEmailQueue() {
  current = current.then(sendDueEmails).catch((err) => reportError(err, { note: "Email queue run failed" }));
  return current;
}

/** Saves the email and returns; sending happens in the background, with retries if it fails. */
export async function enqueueEmail(to: string, subject: string, text: string) {
  await prisma.emailJob.create({ data: { to, subject, body: encryptBody(text) } });
  void drainEmailQueue();
}

export function startEmailWorker() {
  void drainEmailQueue();
  setInterval(() => void drainEmailQueue(), POLL_INTERVAL_MS).unref();
}
