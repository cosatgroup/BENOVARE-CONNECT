import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const nonLues = await prisma.notification.count({
    where: { userId: req.auth!.userId, lu: false },
  });
  return res.json({ notifications, nonLues });
});

notificationsRouter.post("/:id/lu", async (req: AuthenticatedRequest, res) => {
  const notification = await prisma.notification.findFirst({
    where: { id: String(req.params.id), userId: req.auth!.userId },
  });
  if (!notification) {
    return res.status(404).json({ error: "Notification introuvable" });
  }
  const updated = await prisma.notification.update({ where: { id: notification.id }, data: { lu: true } });
  return res.json(updated);
});

notificationsRouter.post("/tout-lire", async (req: AuthenticatedRequest, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.auth!.userId, lu: false },
    data: { lu: true },
  });
  return res.json({ ok: true });
});
