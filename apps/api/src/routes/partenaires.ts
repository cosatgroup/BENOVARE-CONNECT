import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { getPartenaireCompanyForUser } from "../lib/partenaire-context";

export const partenairesRouter = Router();

partenairesRouter.use(requireAuth, requireRole("PARTENAIRE"));

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

const subscriptionSchema = z.object({
  formulePartenaire: z.enum(["ESSENTIEL", "BUSINESS", "ENTERPRISE"]),
});

// §5.7 — Formules de service, avec proratisation automatique évoquée dans
// les specs (non modélisée ici, à ajouter avec la facturation réelle).
partenairesRouter.post("/subscription", async (req: AuthenticatedRequest, res) => {
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const company = await getPartenaireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const prochainRenouvellement = new Date();
  prochainRenouvellement.setMonth(prochainRenouvellement.getMonth() + 1);

  let subscription;
  if (company.subscriptionId) {
    subscription = await prisma.subscription.update({
      where: { id: company.subscriptionId },
      data: { formulePartenaire: parsed.data.formulePartenaire, status: "ACTIVE" },
    });
  } else {
    subscription = await prisma.subscription.create({
      data: { formulePartenaire: parsed.data.formulePartenaire, status: "ACTIVE", prochainRenouvellement },
    });
    await prisma.partenaireCompany.update({
      where: { id: company.id },
      data: { subscriptionId: subscription.id },
    });
  }

  return res.json(subscription);
});
