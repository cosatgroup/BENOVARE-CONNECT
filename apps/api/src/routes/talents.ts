import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { requireAccesActif } from "../middleware/access";
import { getTalentProfileForUser } from "../lib/talent-context";

export const talentsRouter = Router();

talentsRouter.use(requireAuth, requireRole("TALENT"), requireAccesActif);

const onboardingSchema = z.object({
  nom: z.string().min(1),
  prenoms: z.string().min(1),
  linkedin: z.string().optional(),
  adresse: z.string().optional(),
  disponibilite: z.enum(["IMMEDIATE", "A_PARTIR_DE"]).default("IMMEDIATE"),
  disponibleLe: z.string().datetime().optional(),
  modalite: z.enum(["TEMPS_PLEIN", "TEMPS_PARTIEL"]).default("TEMPS_PLEIN"),
  domainesExpertise: z.array(z.string()).default([]),
  competences: z.array(z.string()).default([]),
});

// §3.1/§3.4 — Complétion du profil après inscription : vérification
// d'identité légère non implémentée ici (statut "Talent Vérifié" à
// brancher plus tard sur un vrai contrôle de pièce d'identité).
talentsRouter.post("/onboarding", async (req: AuthenticatedRequest, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.talentProfile.findUnique({ where: { userId: req.auth!.userId } });
  if (existing) {
    return res.status(409).json({ error: "Un profil est déjà rattaché à ce compte" });
  }

  const { domainesExpertise, competences, disponibleLe, ...rest } = parsed.data;

  const profile = await prisma.talentProfile.create({
    data: {
      ...rest,
      disponibleLe: disponibleLe ? new Date(disponibleLe) : undefined,
      userId: req.auth!.userId,
      domainesExpertise: {
        connectOrCreate: domainesExpertise.map((nom) => ({ where: { nom }, create: { nom } })),
      },
      competences: { create: competences.map((nom) => ({ nom })) },
    },
    include: { domainesExpertise: true, competences: true },
  });

  return res.status(201).json(profile);
});

talentsRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const profile = await getTalentProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Aucun profil rattaché à ce compte" });
  }
  return res.json(profile);
});

// §3.3/§7.4 — Les formules Silver/Gold/Platinum ne s'activent plus
// gratuitement ici : elles sont établies au cas par cas par un devis
// Administrateur, payé (KKiaPay/FedaPay/virement) puis activé par le
// titulaire du compte via son code de licence (voir /api/devis, /api/abonnement).
