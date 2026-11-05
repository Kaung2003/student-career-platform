import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "../test/helpers.js";
import { prisma } from "./prisma.js";
import { drainEmailQueue, enqueueEmail } from "./email-queue.js";
import { cleanUp } from "./cleanup.js";

const sent: { to: string; text: string }[] = [];
let providerDown = false;
vi.mock("./email.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./email.js")>()),
  sendEmail: async (to: string, _subject: string, text: string) => {
    if (providerDown) throw new Error("Provider down");
    sent.push({ to, text });
  },
}));

const makeDue = () => prisma.emailJob.updateMany({ data: { runAt: new Date(Date.now() - 1000) } });

beforeEach(async () => {
  await drainEmailQueue();
  await resetDatabase();
  sent.length = 0;
  providerDown = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("email queue", () => {
  it("sends the email and leaves nothing behind", async () => {
    await enqueueEmail("a@example.test", "Hello", "Your link: secret-token");
    await drainEmailQueue();
    expect(sent).toEqual([{ to: "a@example.test", text: "Your link: secret-token" }]);
    expect(await prisma.emailJob.count()).toBe(0);
  });

  it("stores the body encrypted", async () => {
    providerDown = true;
    await enqueueEmail("a@example.test", "Hello", "Your link: secret-token");
    await drainEmailQueue();
    const job = await prisma.emailJob.findFirstOrThrow();
    expect(job.body).not.toContain("secret-token");
  });

  it("retries later when the provider is down, then delivers", async () => {
    providerDown = true;
    await enqueueEmail("a@example.test", "Hello", "Body");
    await drainEmailQueue();

    const job = await prisma.emailJob.findFirstOrThrow();
    expect(job.attempts).toBe(1);
    expect(job.runAt.getTime()).toBeGreaterThan(Date.now());

    // Not due yet, so nothing happens even though the provider is back.
    providerDown = false;
    await drainEmailQueue();
    expect(sent).toHaveLength(0);

    await makeDue();
    await drainEmailQueue();
    expect(sent).toHaveLength(1);
    expect(await prisma.emailJob.count()).toBe(0);
  });

  it("gives up after five attempts and erases the body", async () => {
    providerDown = true;
    await enqueueEmail("a@example.test", "Hello", "Body");
    for (let i = 0; i < 5; i++) {
      await makeDue();
      await drainEmailQueue();
    }
    const job = await prisma.emailJob.findFirstOrThrow();
    expect(job.attempts).toBe(5);
    expect(job.failedAt).not.toBeNull();
    expect(job.body).toBe("");

    await makeDue();
    await drainEmailQueue();
    expect((await prisma.emailJob.findFirstOrThrow()).attempts).toBe(5);
  });

  it("removes failed emails after 30 days", async () => {
    await prisma.emailJob.create({ data: { to: "a@example.test", subject: "Old", body: "", failedAt: new Date(Date.now() - 31 * 24 * 3600 * 1000) } });
    await prisma.emailJob.create({ data: { to: "b@example.test", subject: "New", body: "", failedAt: new Date() } });
    await cleanUp();
    expect((await prisma.emailJob.findMany()).map((j) => j.subject)).toEqual(["New"]);
  });
});
