import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { aAccesActif, dateFinEssai } from "../lib/access";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      mfaEnabled: true,
      createdAt: true,
      talentProfile: { select: { subscription: { select: { status: true } } } },
      prestataireMember: { select: { company: { select: { subscription: { select: { status: true } } } } } },
      partenaireMember: { select: { company: { select: { subscription: { select: { status: true } } } } } },
    },
  });
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable" });
  }

  const estCompteFonctionnel = user.role === "TALENT" || user.role === "PRESTATAIRE" || user.role === "PARTENAIRE";
  const statutAbonnement =
    user.talentProfile?.subscription?.status ??
    user.prestataireMember?.company.subscription?.status ??
    user.partenaireMember?.company.subscription?.status ??
    null;

  return res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    mfaEnabled: user.mfaEnabled,
    accesActif: estCompteFonctionnel ? aAccesActif(user.createdAt, statutAbonnement) : true,
    essaiExpireLe: estCompteFonctionnel ? dateFinEssai(user.createdAt) : null,
    abonnementActif: statutAbonnement === "ACTIVE",
  });
});
