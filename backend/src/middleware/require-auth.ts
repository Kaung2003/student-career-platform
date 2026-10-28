import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken, type AuthTokenPayload } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { SESSION_COOKIE } from "../lib/session.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
      /** "bearer" when the client still sends the legacy Authorization header instead of the cookie. */
      authVia?: "cookie" | "bearer";
    }
  }
}

function readToken(req: Request): { token: string; via: "cookie" | "bearer" } | null {
  const cookie = req.cookies?.[SESSION_COOKIE];
  if (typeof cookie === "string" && cookie) return { token: cookie, via: "cookie" };

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return { token: header.slice("Bearer ".length), via: "bearer" };

  return null;
}

type Resolved =
  | { ok: true; auth: AuthTokenPayload; via: "cookie" | "bearer" }
  | { ok: false; status: number; error: string };

async function resolve(req: Request): Promise<Resolved | null> {
  const found = readToken(req);
  if (!found) return null;

  let payload: AuthTokenPayload;
  try {
    payload = verifyAuthToken(found.token);
  } catch {
    return { ok: false, status: 401, error: "Invalid or expired session" };
  }

  // Look the user up on every request so role changes and suspensions apply immediately.
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true, suspended: true },
  });

  if (!user) return { ok: false, status: 401, error: "Account no longer exists" };
  if (user.suspended) {
    return { ok: false, status: 403, error: "This account has been suspended. Contact support for help." };
  }

  return { ok: true, auth: { userId: payload.userId, role: user.role }, via: found.via };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await resolve(req);
    if (!result) {
      res.status(401).json({ error: "Please log in to continue" });
      return;
    }
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    req.auth = result.auth;
    req.authVia = result.via;
    next();
  } catch (err) {
    next(err);
  }
}

/** Attaches req.auth when a valid session is present, but never rejects the request. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const result = await resolve(req);
    if (result?.ok) {
      req.auth = result.auth;
      req.authVia = result.via;
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
