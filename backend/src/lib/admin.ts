import { prisma } from "./prisma.js";

/** Emails listed in ADMIN_EMAILS (comma-separated) are promoted to ADMIN when they sign in. */
function adminEmails(): Set<string> {
  return new Set(
    (process.env["ADMIN_EMAILS"] ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function ensureBootstrapAdmin<T extends { id: string; email: string; role: string }>(user: T): Promise<T> {
  if (user.role === "ADMIN" || !adminEmails().has(user.email.toLowerCase())) return user;
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  return { ...user, role: "ADMIN" };
}
