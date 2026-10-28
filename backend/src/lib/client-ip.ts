import type { Request } from "express";

/** The visitor's IP. Netlify's proxy forwards the real client address in its own header. */
export function clientIp(req: Request): string {
  const netlify = req.headers["x-nf-client-connection-ip"];
  if (typeof netlify === "string" && netlify) return netlify;
  return req.ip ?? "unknown";
}
