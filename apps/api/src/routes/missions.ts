import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { getPartenaireCompanyForUser } from "../lib/partenaire-context";

export const missionsRouter = Router();

missionsRouter.use(requireAuth, requireRole("PARTENAIRE"));

// §5.5 — Missions en cours et clôturées : suivi des jalons, livrables,
// messagerie, et examen des demandes de délai/avenant (décision conjointe
// avec Benovare).
missionsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const company = await getPartenaireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const missions = await prisma.mission.findMany({
    where: { besoin: { partenaireCompanyId: company.id } },
    include: { besoin: true, jalons: { orderBy: { ordre: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json(missions);
});

async function assertMissionBelongsToPartenaire(missionId: string, companyId: string) {
  return prisma.mission.findFirst({
    where: { id: missionId, besoin: { partenaireCompanyId: companyId } },
  });
}

missionsRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  const company = await getPartenaireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const mission = await prisma.mission.findFirst({
    where: { id: String(req.params.id), besoin: { partenaireCompanyId: company.id } },
    include: {
      besoin: { include: { candidatures: { where: { statut: "ACCEPTEE" }, include: { talent: true, prestataireCompany: true } } } },
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

const demandeDecisionSchema = z.object({
  decision: z.enum(["VALIDEE", "REFUSEE"]),
});

// Décision du Partenaire sur une demande de délai/avenant, après
// recommandation du Gestionnaire de compte (§2, §5.5, §6.4).
missionsRouter.post("/:id/demandes/:demandeId/decision", async (req: AuthenticatedRequest, res) => {
  const parsed = demandeDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const company = await getPartenaireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const mission = await assertMissionBelongsToPartenaire(String(req.params.id), company.id);
  if (!mission) {
    return res.status(404).json({ error: "Mission introuvable" });
  }

  const demande = await prisma.demandeAvenant.findFirst({
    where: { id: String(req.params.demandeId), missionId: mission.id },
  });
  if (!demande) {
    return res.status(404).json({ error: "Demande introuvable" });
  }

  const updated = await prisma.demandeAvenant.update({
    where: { id: demande.id },
    data: { statut: parsed.data.decision, traiteLe: new Date() },
  });

  return res.json(updated);
});

const messageSchema = z.object({ contenu: z.string().min(1) });

// Messagerie intégrée par mission (§2) — canal tracé entre Talent/
// Prestataire, Gestionnaire de compte et Partenaire.
missionsRouter.post("/:id/messages", async (req: AuthenticatedRequest, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const company = await getPartenaireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const mission = await assertMissionBelongsToPartenaire(String(req.params.id), company.id);
  if (!mission) {
    return res.status(404).json({ error: "Mission introuvable" });
  }

  const message = await prisma.message.create({
    data: { missionId: mission.id, authorId: req.auth!.userId, contenu: parsed.data.contenu },
    include: { author: { select: { email: true, role: true } } },
  });

  return res.status(201).json(message);
});
