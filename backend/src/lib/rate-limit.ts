import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";
import { clientIp } from "./client-ip.js";
import { PostgresStore } from "./rate-limit-store.js";

const message = (what: string) => ({ error: `Too many ${what}. Please wait a few minutes and try again.` });
const skip = () => process.env["NODE_ENV"] === "test";
// If the counters can't be read, let the request through: the database being down shouldn't add a second error.
const durable = (name: string) => ({ store: new PostgresStore(name), passOnStoreError: true });

/** Login attempts per email address — stops password guessing against one account. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip,
  ...durable("login"),
  keyGenerator: (req: Request) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    return `login:${email || ipKeyGenerator(clientIp(req))}`;
  },
  message: message("login attempts"),
});

/** New accounts and password-reset emails per visitor. */
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  skip,
  ...durable("signup"),
  keyGenerator: (req: Request) => ipKeyGenerator(clientIp(req)),
  message: message("requests"),
});

/** AI calls per signed-in user — keeps one account from running up the Gemini bill. */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  skip,
  ...durable("ai"),
  keyGenerator: (req: Request) => `ai:${req.auth?.userId ?? ipKeyGenerator(clientIp(req))}`,
  message: message("AI requests"),
});

/** Company searches per company account — enough for real use, not for copying every student. */
export const companySearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  skip,
  ...durable("company-search"),
  keyGenerator: (req: Request) => `company-search:${req.auth?.userId ?? ipKeyGenerator(clientIp(req))}`,
  message: message("searches"),
});

/** A generous ceiling for everything else. Kept in memory: a database write on every request isn't worth it here. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  skip,
  keyGenerator: (req: Request) => ipKeyGenerator(clientIp(req)),
  message: message("requests"),
});
