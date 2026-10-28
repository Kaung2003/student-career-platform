import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";
import { clientIp } from "./client-ip.js";

const message = (what: string) => ({ error: `Too many ${what}. Please wait a few minutes and try again.` });
const skip = () => process.env["NODE_ENV"] === "test";

/** Login attempts per email address — stops password guessing against one account. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip,
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
  keyGenerator: (req: Request) => ipKeyGenerator(clientIp(req)),
  message: message("requests"),
});

/** AI calls per signed-in user — keeps one account from running up the Gemini bill. */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  skip,
  keyGenerator: (req: Request) => `ai:${req.auth?.userId ?? ipKeyGenerator(clientIp(req))}`,
  message: message("AI requests"),
});

/** A generous ceiling for everything else. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  skip,
  keyGenerator: (req: Request) => ipKeyGenerator(clientIp(req)),
  message: message("requests"),
});
