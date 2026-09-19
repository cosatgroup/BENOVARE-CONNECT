import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { requireAccesActif } from "../middleware/access";
import { getPrestataireCompanyForUser } from "../lib/prestataire-context";

export const prestatairesRouter = Router();

prestatairesRouter.use(requireAuth, requireRole("PRESTATAIRE"), requireAccesActif);

const onboardingSchema = z.object({
  raisonSociale: z.string().min(2),
  secteurActivite: z.string().optional(),
  effectif: z.number().int().positive().optional(),
  anneeCreation: z.number().int().optional(),
  coordonnees: z.string().optional(),
});

// §4.1 — Création de l'entreprise Prestataire, le premier compte devenant
// le représentant légal. Le KYB reste à valider par le Gestionnaire de
// compte / Administrateur (verifieKYB par défaut false).
prestatairesRouter.post("/onboarding", async (req: AuthenticatedRequest, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await getPrestataireCompanyForUser(req.auth!.userId);
  if (existing) {
    return res.status(409).json({ error: "Une entreprise est déjà rattachée à ce compte" });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });

  const company = await prisma.prestataireCompany.create({
    data: {
      ...parsed.data,
      membres: {
        create: { userId: user.id, nom: user.email, role: "REPRESENTANT_LEGAL" },
      },
    },
    include: { membres: true },
  });

  return res.status(201).json(company);
});

prestatairesRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const company = await getPrestataireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }
  return res.json(company);
});

// §4.3/§7.4 — Les formules Silver/Gold/Platinum ne s'activent plus
// gratuitement ici : elles sont établies au cas par cas par un devis
// Administrateur, payé (KKiaPay/FedaPay/virement) puis activé par le
// titulaire du compte via son code de licence (voir /api/devis, /api/abonnement).
