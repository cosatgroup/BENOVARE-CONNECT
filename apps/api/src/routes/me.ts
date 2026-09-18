import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { id: true, email: true, role: true, status: true, mfaEnabled: true },
  });
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable" });
  }
  return res.json(user);
});
