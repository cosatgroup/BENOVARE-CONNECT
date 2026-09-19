import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { requireAccesActif } from "../middleware/access";
import { getPrestataireCompanyForUser, maxEtoilesForPalier } from "../lib/prestataire-context";
import { notifyPartenaireCompany } from "../lib/notifications";

export const projetsRouter = Router();

projetsRouter.use(requireAuth, requireRole("PRESTATAIRE"), requireAccesActif);

// §4.5 — Catalogue des besoins de recrutement de prestataire publiés par
// les Partenaires, filtré selon le palier d'abonnement de l'entreprise.
projetsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const company = await getPrestataireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const maxEtoiles = maxEtoilesForPalier(company.subscription?.palierEtoiles);
  if (maxEtoiles === 0) {
    return res.json([]);
  }

  const besoins = await prisma.besoin.findMany({
    where: {
      type: "RECRUTEMENT_PRESTATAIRE",
      statut: "OUVERT",
      niveauEtoiles: { lte: maxEtoiles },
      // Les appels d'offres de placement Benovare relèvent du menu
      // Carrières, pas du catalogue Projets (§4.6 vs §4.5).
      publieParBenovare: false,
    },
    include: { partenaireCompany: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json(besoins);
});

projetsRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  const company = await getPrestataireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const besoin = await prisma.besoin.findFirst({
    where: { id: String(req.params.id), type: "RECRUTEMENT_PRESTATAIRE" },
    include: { partenaireCompany: true },
  });
  if (!besoin) {
    return res.status(404).json({ error: "Appel d'offres introuvable" });
  }

  const candidature = await prisma.candidature.findFirst({
    where: { besoinId: besoin.id, prestataireCompanyId: company.id },
  });

  return res.json({ ...besoin, maCandidature: candidature });
});

const soumissionSchema = z.object({ equipeProposee: z.array(z.string()).default([]) });

// Soumission avec une équipe de plusieurs consultants (§4.5). Les membres
// sont ici de simples noms indicatifs tant que la gestion des
// collaborateurs (invitation, rattachement) n'est pas construite.
projetsRouter.post("/:id/soumettre", async (req: AuthenticatedRequest, res) => {
  const parsed = soumissionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const company = await getPrestataireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const besoin = await prisma.besoin.findFirst({
    where: { id: String(req.params.id), type: "RECRUTEMENT_PRESTATAIRE", statut: "OUVERT" },
  });
  if (!besoin) {
    return res.status(404).json({ error: "Appel d'offres introuvable ou clos" });
  }

  const existing = await prisma.candidature.findFirst({
    where: { besoinId: besoin.id, prestataireCompanyId: company.id },
  });
  if (existing) {
    return res.status(409).json({ error: "Vous avez déjà soumissionné à cet appel d'offres" });
  }

  const candidature = await prisma.candidature.create({
    data: {
      besoinId: besoin.id,
      prestataireCompanyId: company.id,
      equipeProposee: parsed.data.equipeProposee,
    },
  });

  if (besoin.partenaireCompanyId) {
    await notifyPartenaireCompany(
      besoin.partenaireCompanyId,
      "OPPORTUNITE",
      "Nouvelle soumission reçue",
      `${company.raisonSociale} a soumissionné à « ${besoin.titre} ».`
    );
  }

  return res.status(201).json(candidature);
});
