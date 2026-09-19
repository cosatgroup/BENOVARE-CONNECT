import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { requireAccesActif } from "../middleware/access";
import { getPrestataireCompanyForUser } from "../lib/prestataire-context";

export const prestataireMissionsRouter = Router();

prestataireMissionsRouter.use(requireAuth, requireRole("PRESTATAIRE"), requireAccesActif);

async function findMissionForCompany(missionId: string, companyId: string) {
  return prisma.mission.findFirst({
    where: { id: missionId, besoin: { candidatures: { some: { prestataireCompanyId: companyId, statut: "ACCEPTEE" } } } },
  });
}

// §4.5 Pilotage — jalons, livrables, messagerie, affectation des
// collaborateurs (à venir), déclaration d'imprévu.
prestataireMissionsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const company = await getPrestataireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const missions = await prisma.mission.findMany({
    where: { besoin: { candidatures: { some: { prestataireCompanyId: company.id, statut: "ACCEPTEE" } } } },
    include: { besoin: { include: { partenaireCompany: true } }, jalons: { orderBy: { ordre: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json(missions);
});

prestataireMissionsRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  const company = await getPrestataireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const mission = await prisma.mission.findFirst({
    where: { id: String(req.params.id), besoin: { candidatures: { some: { prestataireCompanyId: company.id, statut: "ACCEPTEE" } } } },
    include: {
      besoin: { include: { partenaireCompany: true } },
      jalons: { orderBy: { ordre: "asc" } },
      livrables: { orderBy: { deposeLe: "desc" } },
      demandes: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { email: true, role: true } } } },
    },
  });
  if (!mission) {
    return res.status(404).json({ error: "Mission introuvable" });
  }

  return res.json(mission);
});

const demandeSchema = z.object({
  type: z.enum(["DELAI", "AVENANT"]),
  motif: z.string().min(5),
  dureeJours: z.number().int().positive().optional(),
});

prestataireMissionsRouter.post("/:id/demandes", async (req: AuthenticatedRequest, res) => {
  const parsed = demandeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const company = await getPrestataireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const mission = await findMissionForCompany(String(req.params.id), company.id);
  if (!mission) {
    return res.status(404).json({ error: "Mission introuvable" });
  }

  const demande = await prisma.demandeAvenant.create({
    data: { missionId: mission.id, ...parsed.data, declarationAnticipee: true },
  });

  return res.status(201).json(demande);
});

const messageSchema = z.object({ contenu: z.string().min(1) });

prestataireMissionsRouter.post("/:id/messages", async (req: AuthenticatedRequest, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const company = await getPrestataireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const mission = await findMissionForCompany(String(req.params.id), company.id);
  if (!mission) {
    return res.status(404).json({ error: "Mission introuvable" });
  }

  const message = await prisma.message.create({
    data: { missionId: mission.id, authorId: req.auth!.userId, contenu: parsed.data.contenu },
    include: { author: { select: { email: true, role: true } } },
  });

  return res.status(201).json(message);
});

const rechercheTalentSchema = z.object({
  titre: z.string().min(3),
  description: z.string().min(10),
  niveauEtoiles: z.number().int().min(1).max(4),
  categorieTechnique: z.string().optional(),
});

// Recherche de talents pour compléter l'équipe d'un projet déjà engagé via
// Benovare Connect — publie un avis visible dans le menu Opportunités des
// Talents, onglet « Recherche de talents — Prestataires » (§4.5).
prestataireMissionsRouter.post("/:id/rechercher-talents", async (req: AuthenticatedRequest, res) => {
  const parsed = rechercheTalentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const company = await getPrestataireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const mission = await findMissionForCompany(String(req.params.id), company.id);
  if (!mission) {
    return res.status(404).json({ error: "Mission introuvable" });
  }

  const missionAvecBesoin = await prisma.mission.findUniqueOrThrow({
    where: { id: mission.id },
    include: { besoin: true },
  });

  // NOTE : Besoin.partenaireCompanyId est une FK obligatoire côté schéma ;
  // on la fait pointer vers le Partenaire client de la mission d'origine
  // (relation contractuelle réelle), mais cet avis n'est pas piloté par lui
  // — prestataireCompanyId est le signal qui le distingue dans les listes.
  const avis = await prisma.besoin.create({
    data: {
      type: "RECRUTEMENT_TALENT",
      titre: parsed.data.titre,
      description: parsed.data.description,
      niveauEtoiles: parsed.data.niveauEtoiles,
      categorieTechnique: parsed.data.categorieTechnique,
      partenaireCompanyId: missionAvecBesoin.besoin.partenaireCompanyId,
      prestataireCompanyId: company.id,
    },
  });

  return res.status(201).json(avis);
});
