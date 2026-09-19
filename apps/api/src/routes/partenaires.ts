import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { requireAccesActif } from "../middleware/access";
import { getPartenaireCompanyForUser } from "../lib/partenaire-context";

export const partenairesRouter = Router();

partenairesRouter.use(requireAuth, requireRole("PARTENAIRE"), requireAccesActif);

const onboardingSchema = z.object({
  raisonSociale: z.string().min(2),
  secteurActivite: z.string().optional(),
  coordonnees: z.string().optional(),
});

// Création de l'entreprise Partenaire et rattachement du premier compte en
// tant que représentant (rôle Direction) — §5.1. Le KYB reste à valider par
// le Gestionnaire de compte / Administrateur (verifieKYB par défaut false).
partenairesRouter.post("/onboarding", async (req: AuthenticatedRequest, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await getPartenaireCompanyForUser(req.auth!.userId);
  if (existing) {
    return res.status(409).json({ error: "Une entreprise est déjà rattachée à ce compte" });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });

  const company = await prisma.partenaireCompany.create({
    data: {
      ...parsed.data,
      membres: {
        create: { userId: user.id, nom: user.email, role: "DIRECTION" },
      },
    },
  });

  return res.status(201).json(company);
});

partenairesRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const company = await prisma.partenaireCompany.findFirst({
    where: { membres: { some: { userId: req.auth!.userId } } },
    include: { membres: true, subscription: true },
  });
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }
  return res.json(company);
});

// §5.7/§7.4 — Les formules Essentiel/Business/Enterprise ne s'activent plus
// gratuitement ici : elles sont établies au cas par cas par un devis
// Administrateur, payé (KKiaPay/FedaPay/virement) puis activé par le
// titulaire du compte via son code de licence (voir /api/devis, /api/abonnement).
