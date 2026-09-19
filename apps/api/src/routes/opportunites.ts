import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { getTalentProfileForUser, maxEtoilesForPalier } from "../lib/talent-context";
import { notifyPartenaireCompany } from "../lib/notifications";

export const opportunitesRouter = Router();

opportunitesRouter.use(requireAuth, requireRole("TALENT"));

// §3.5 — Catalogue filtré selon le palier d'abonnement, avec deux onglets :
// avis de recrutement publiés par les Partenaires, et avis de recherche de
// talents publiés par des Prestataires déjà engagés sur un projet.
opportunitesRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const profile = await getTalentProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Aucun profil rattaché à ce compte" });
  }

  const maxEtoiles = maxEtoilesForPalier(profile.subscription?.palierEtoiles);
  if (maxEtoiles === 0) {
    return res.json({ avisPartenaires: [], avisPrestataires: [] });
  }

  const besoins = await prisma.besoin.findMany({
    where: {
      type: "RECRUTEMENT_TALENT",
      statut: "OUVERT",
      niveauEtoiles: { lte: maxEtoiles },
      // Les offres de placement Benovare relèvent du menu Carrières, pas du
      // catalogue Opportunités (§3.6 vs §3.5).
      publieParBenovare: false,
    },
    include: { partenaireCompany: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json({
    avisPartenaires: besoins.filter((b) => !b.prestataireCompanyId),
    avisPrestataires: besoins.filter((b) => b.prestataireCompanyId),
  });
});

opportunitesRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  const profile = await getTalentProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Aucun profil rattaché à ce compte" });
  }

  const besoin = await prisma.besoin.findFirst({
    where: { id: String(req.params.id), type: "RECRUTEMENT_TALENT" },
    include: { partenaireCompany: true },
  });
  if (!besoin) {
    return res.status(404).json({ error: "Avis introuvable" });
  }

  const candidature = await prisma.candidature.findFirst({
    where: { besoinId: besoin.id, talentId: profile.id },
  });

  return res.json({ ...besoin, maCandidature: candidature });
});

const candidatureSchema = z.object({ messageMotive: z.string().optional() });

// Candidature simple — CV technique, preuves de compétences déjà portées
// par le profil ; entretien de sélection mené ensuite en deux temps.
opportunitesRouter.post("/:id/candidater", async (req: AuthenticatedRequest, res) => {
  const parsed = candidatureSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const profile = await getTalentProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Aucun profil rattaché à ce compte" });
  }

  const besoin = await prisma.besoin.findFirst({
    where: { id: String(req.params.id), type: "RECRUTEMENT_TALENT", statut: "OUVERT" },
  });
  if (!besoin) {
    return res.status(404).json({ error: "Avis introuvable ou clos" });
  }

  const existing = await prisma.candidature.findFirst({
    where: { besoinId: besoin.id, talentId: profile.id },
  });
  if (existing) {
    return res.status(409).json({ error: "Vous avez déjà candidaté à cet avis" });
  }

  const candidature = await prisma.candidature.create({
    data: { besoinId: besoin.id, talentId: profile.id, messageMotive: parsed.data.messageMotive },
  });

  if (besoin.partenaireCompanyId) {
    await notifyPartenaireCompany(
      besoin.partenaireCompanyId,
      "OPPORTUNITE",
      "Nouvelle candidature reçue",
      `${profile.prenoms} ${profile.nom} a candidaté à « ${besoin.titre} ».`
    );
  }

  return res.status(201).json(candidature);
});
