import { prisma } from "./prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

/** Records an admin action. Failures are logged, never shown to the admin. */
export async function audit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details?: Prisma.InputJsonValue,
) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, targetType, targetId, ...(details !== undefined ? { details } : {}) },
    });
  } catch (err) {
    console.error("Failed to write audit log", err);
  }
}
