import { prisma } from "./prisma.js";
import type { NotificationType } from "../generated/prisma/enums.js";
import type { Prisma } from "../generated/prisma/client.js";

/** Creates an in-app notification. The client renders `data` in the reader's language. */
export async function notify(userId: string, type: NotificationType, data: Prisma.InputJsonValue) {
  try {
    await prisma.notification.create({ data: { userId, type, data } });
  } catch (err) {
    console.error("Failed to create notification", err);
  }
}
