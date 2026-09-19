import type { NextFunction, Response } from "express";
import { prisma } from "../lib/prisma";
import { aAccesActif, dateFinEssai } from "../lib/access";
import type { AuthenticatedRequest } from "./auth";

// À placer après requireAuth/requireRole sur les routeurs "fonctionnels"
// (missions, candidatures, besoins, projets, veille, etc.) des consoles
// Talent/Prestataire/Partenaire — jamais sur /api/me, /api/devis,
// /api/abonnement ou /api/notifications, qui doivent rester joignables même
// essai expiré.
export async function requireAccesActif(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const role = req.auth!.role;
  if (role !== "TALENT" && role !== "PRESTATAIRE" && role !== "PARTENAIRE") {
    return next();
  }

  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: {
      createdAt: true,
      talentProfile: { select: { subscription: { select: { status: true } } } },
      prestataireMember: { select: { company: { select: { subscription: { select: { status: true } } } } } },
      partenaireMember: { select: { company: { select: { subscription: { select: { status: true } } } } } },
    },
  });
  if (!user) {
    return res.status(401).json({ error: "Compte introuvable" });
  }

  const statutAbonnement =
    user.talentProfile?.subscription?.status ??
    user.prestataireMember?.company.subscription?.status ??
    user.partenaireMember?.company.subscription?.status ??
    null;

  if (!aAccesActif(user.createdAt, statutAbonnement)) {
    return res.status(402).json({
      error: "Votre période d'essai de 30 jours est terminée. Souscrivez un abonnement pour continuer.",
      code: "ESSAI_EXPIRE",
      essaiExpireLe: dateFinEssai(user.createdAt),
    });
  }

  return next();
}
