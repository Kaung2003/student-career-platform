import { beforeEach, describe, expect, it } from "vitest";
import type { Options } from "express-rate-limit";
import { resetDatabase } from "../test/helpers.js";
import { prisma } from "./prisma.js";
import { PostgresStore } from "./rate-limit-store.js";

const store = (name = "test", windowMs = 60_000) => {
  const s = new PostgresStore(name);
  s.init({ windowMs } as Options);
  return s;
};

beforeEach(resetDatabase);

describe("rate-limit store", () => {
  it("counts hits, and a new store instance (a restart, or a second server) sees the same count", async () => {
    await store().increment("a");
    expect((await store().increment("a")).totalHits).toBe(2);
  });

  it("counts correctly when requests arrive at the same moment", async () => {
    const s = store();
    await Promise.all(Array.from({ length: 20 }, () => s.increment("a")));
    expect((await s.increment("a")).totalHits).toBe(21);
  });

  it("starts again once the window has passed", async () => {
    const s = store();
    await s.increment("a");
    await prisma.rateLimitCounter.updateMany({ data: { resetAt: new Date(Date.now() - 1000) } });
    expect((await s.increment("a")).totalHits).toBe(1);
  });

  it("keeps limiters and keys apart, and doesn't store the key itself", async () => {
    await store("login").increment("ada@example.test");
    expect((await store("signup").increment("ada@example.test")).totalHits).toBe(1);
    expect((await store("login").increment("other@example.test")).totalHits).toBe(1);
    expect(JSON.stringify(await prisma.rateLimitCounter.findMany())).not.toContain("ada@example.test");
  });

  it("can undo a hit and clear a key", async () => {
    const s = store();
    await s.increment("a");
    await s.increment("a");
    await s.decrement("a");
    expect((await s.increment("a")).totalHits).toBe(2);
    await s.resetKey("a");
    expect((await s.increment("a")).totalHits).toBe(1);
  });
});
