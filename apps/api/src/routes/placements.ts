import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { getTalentProfileForUser } from "../lib/talent-context";
import { getPrestataireCompanyForUser } from "../lib/prestataire-context";

export const placementsRouter = Router();

// §3.6/§4.6/§7.7 — Offres de placement confiées directement à Benovare par
// une entreprise hors plateforme, publiées et gérées par l'Administrateur
// ou le Gestionnaire de compte. Réutilisent le Besoin standard
// (publieParBenovare: true, sans partenaireCompanyId) — même parcours de
// candidature, d'entretiens et de pilotage qu'un projet classique.

const placementSchema = z.object({
  type: z.enum(["RECRUTEMENT_TALENT", "RECRUTEMENT_PRESTATAIRE"]),
  titre: z.string().min(3),
  description: z.string().min(10),
  niveauEtoiles: z.number().int().min(1).max(4),
  entrepriseClienteNom: z.string().min(1),
  categorieTechnique: z.string().optional(),
});

// Gestion — Administrateur ou Gestionnaire de compte.
placementsRouter.post(
  "/",
  requireAuth,
  requireRole("ADMINISTRATEUR", "GESTIONNAIRE"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = placementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const placement = await prisma.besoin.create({
      data: { ...parsed.data, publieParBenovare: true },
    });
    return res.status(201).json(placement);
  }
);

placementsRouter.get(
  "/",
  requireAuth,
  requireRole("ADMINISTRATEUR", "GESTIONNAIRE"),
  async (_req: AuthenticatedRequest, res) => {
    const placements = await prisma.besoin.findMany({
      where: { publieParBenovare: true },
      include: { _count: { select: { candidatures: true } }, mission: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(placements);
  }
);

// Consultation — Talents (recrutement direct).
placementsRouter.get("/talents", requireAuth, requireRole("TALENT"), async (req: AuthenticatedRequest, res) => {
  const profile = await getTalentProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Aucun profil rattaché à ce compte" });
  }

  const placements = await prisma.besoin.findMany({
    where: { type: "RECRUTEMENT_TALENT", publieParBenovare: true, statut: "OUVERT" },
    orderBy: { createdAt: "desc" },
  });
  return res.json(placements);
});

// Consultation — Prestataires (appels d'offres de placement).
placementsRouter.get(
  "/prestataires",
  requireAuth,
  requireRole("PRESTATAIRE"),
  async (req: AuthenticatedRequest, res) => {
    const company = await getPrestataireCompanyForUser(req.auth!.userId);
    if (!company) {
      return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
    }

    const placements = await prisma.besoin.findMany({
      where: { type: "RECRUTEMENT_PRESTATAIRE", publieParBenovare: true, statut: "OUVERT" },
      orderBy: { createdAt: "desc" },
    });
    return res.json(placements);
  }
);
