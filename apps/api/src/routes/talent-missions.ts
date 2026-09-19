import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { getTalentProfileForUser } from "../lib/talent-context";

export const talentMissionsRouter = Router();

talentMissionsRouter.use(requireAuth, requireRole("TALENT"));

async function findMissionForTalent(missionId: string, talentId: string) {
  return prisma.mission.findFirst({
    where: { id: missionId, besoin: { candidatures: { some: { talentId, statut: "ACCEPTEE" } } } },
  });
}

// §3.5 Pilotage — jalons, échéancier, livrables attendus, messagerie dédiée
// et déclaration d'imprévu (délai/avenant), examinée par Benovare et le
// Partenaire (décision côté Partenaire — cf. missions.ts).
talentMissionsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const profile = await getTalentProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Aucun profil rattaché à ce compte" });
  }

  const missions = await prisma.mission.findMany({
    where: { besoin: { candidatures: { some: { talentId: profile.id, statut: "ACCEPTEE" } } } },
    include: { besoin: { include: { partenaireCompany: true } }, jalons: { orderBy: { ordre: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json(missions);
});

talentMissionsRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  const profile = await getTalentProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Aucun profil rattaché à ce compte" });
  }

  const mission = await prisma.mission.findFirst({
    where: { id: String(req.params.id), besoin: { candidatures: { some: { talentId: profile.id, statut: "ACCEPTEE" } } } },
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

talentMissionsRouter.post("/:id/demandes", async (req: AuthenticatedRequest, res) => {
  const parsed = demandeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const profile = await getTalentProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Aucun profil rattaché à ce compte" });
  }

  const mission = await findMissionForTalent(String(req.params.id), profile.id);
  if (!mission) {
    return res.status(404).json({ error: "Mission introuvable" });
  }

  const demande = await prisma.demandeAvenant.create({
    data: { missionId: mission.id, ...parsed.data, declarationAnticipee: true },
  });

  return res.status(201).json(demande);
});

const messageSchema = z.object({ contenu: z.string().min(1) });

talentMissionsRouter.post("/:id/messages", async (req: AuthenticatedRequest, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const profile = await getTalentProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Aucun profil rattaché à ce compte" });
  }

  const mission = await findMissionForTalent(String(req.params.id), profile.id);
  if (!mission) {
    return res.status(404).json({ error: "Mission introuvable" });
  }

  const message = await prisma.message.create({
    data: { missionId: mission.id, authorId: req.auth!.userId, contenu: parsed.data.contenu },
    include: { author: { select: { email: true, role: true } } },
  });

  return res.status(201).json(message);
});
