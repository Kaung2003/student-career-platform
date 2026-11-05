import { createHash } from "crypto";
import type { Options, Store } from "express-rate-limit";
import { prisma } from "./prisma.js";

/** Rate-limit counts kept in Postgres, so restarts don't reset them and every server shares them. */
export class PostgresStore implements Store {
  localKeys = false;
  private windowMs = 60_000;

  constructor(readonly prefix: string) {}

  init(options: Options) {
    this.windowMs = options.windowMs;
  }

  private id(key: string) {
    return createHash("sha256").update(`${this.prefix}:${key}`).digest("hex");
  }

  async increment(key: string) {
    const now = new Date();
    const resetAt = new Date(now.getTime() + this.windowMs);
    // One statement, so simultaneous requests can't both read the same count.
    const rows = await prisma.$queryRaw<{ hits: number; resetAt: Date }[]>`
      INSERT INTO "RateLimitCounter" ("key", "hits", "resetAt")
      VALUES (${this.id(key)}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "hits" = CASE WHEN "RateLimitCounter"."resetAt" <= ${now} THEN 1 ELSE "RateLimitCounter"."hits" + 1 END,
        "resetAt" = CASE WHEN "RateLimitCounter"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimitCounter"."resetAt" END
      RETURNING "hits", "resetAt"
    `;
    return { totalHits: rows[0]!.hits, resetTime: rows[0]!.resetAt };
  }

  async decrement(key: string) {
    await prisma.rateLimitCounter.updateMany({ where: { key: this.id(key), hits: { gt: 0 } }, data: { hits: { decrement: 1 } } });
  }

  async resetKey(key: string) {
    await prisma.rateLimitCounter.deleteMany({ where: { key: this.id(key) } });
  }
}
