import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", async (req, res) => {
  const userId = req.auth!.userId;
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  res.json({ notifications, unread });
});

notificationRouter.post("/read-all", async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.auth!.userId, readAt: null },
    data: { readAt: new Date() },
  });
  res.status(204).send();
});

notificationRouter.post("/:id/read", async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { id: req.params["id"] as string, userId: req.auth!.userId, readAt: null },
    data: { readAt: new Date() },
  });
  if (result.count === 0 && !(await prisma.notification.findFirst({ where: { id: req.params["id"] as string, userId: req.auth!.userId } }))) {
    throw new HttpError(404, "Notification not found");
  }
  res.status(204).send();
});
