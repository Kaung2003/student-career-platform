import type { CookieOptions, Request, Response } from "express";

export const SESSION_COOKIE = "scp_session";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions(req: Request): CookieOptions {
  return {
    httpOnly: true, // not readable from JavaScript, so a script injection can't steal the session
    secure: req.secure,
    sameSite: "lax", // not sent on cross-site POSTs, which blocks CSRF
    path: "/",
  };
}

export function setSessionCookie(req: Request, res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(req), maxAge: SEVEN_DAYS_MS });
}

export function clearSessionCookie(req: Request, res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions(req));
}
