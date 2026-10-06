import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken, type AuthTokenPayload } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  let payload: AuthTokenPayload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Look the user up on every request so role changes and suspensions apply immediately.
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, suspended: true },
    });

    if (!user) {
      res.status(401).json({ error: "Account no longer exists" });
      return;
    }

    if (user.suspended) {
      res.status(403).json({ error: "This account has been suspended. Contact support for help." });
      return;
    }

    req.auth = { userId: payload.userId, role: user.role };
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
