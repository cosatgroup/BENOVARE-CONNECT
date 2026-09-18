import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { getPartenaireCompanyForUser } from "../lib/partenaire-context";

export const candidaturesRouter = Router();

candidaturesRouter.use(requireAuth, requireRole("PARTENAIRE"));

// §5.4 — Candidatures et sélection. Le premier entretien (technique et
// administratif) est mené par le Gestionnaire de compte ; le Partenaire ne
// voit son résultat qu'une fois transmis, puis conduit l'entretien final et
// prend la décision de sélection.
candidaturesRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const company = await getPartenaireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const candidatures = await prisma.candidature.findMany({
    where: { besoin: { partenaireCompanyId: company.id } },
    include: { besoin: true, talent: true, prestataireCompany: true, entretiens: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json(candidatures);
});

async function assertCandidatureBelongsToPartenaire(candidatureId: string, companyId: string) {
  return prisma.candidature.findFirst({
    where: { id: candidatureId, besoin: { partenaireCompanyId: companyId } },
    include: { besoin: true },
  });
}

const decisionSchema = z.object({
  decision: z.enum(["ACCEPTEE", "REFUSEE"]),
  messageMotive: z.string().optional(),
});

// Décision finale de sélection — appartient au Partenaire (§2, §5.4). Une
// acceptation fait basculer automatiquement la candidature vers une mission.
candidaturesRouter.post("/:id/decision", async (req: AuthenticatedRequest, res) => {
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const company = await getPartenaireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const candidature = await assertCandidatureBelongsToPartenaire(String(req.params.id), company.id);
  if (!candidature) {
    return res.status(404).json({ error: "Candidature introuvable" });
  }

  const updated = await prisma.candidature.update({
    where: { id: candidature.id },
    data: { statut: parsed.data.decision, messageMotive: parsed.data.messageMotive },
  });

  if (parsed.data.decision === "ACCEPTEE") {
    await prisma.mission.upsert({
      where: { besoinId: candidature.besoinId },
      update: {},
      create: { besoinId: candidature.besoinId },
    });
    await prisma.besoin.update({ where: { id: candidature.besoinId }, data: { statut: "CLOS" } });
  }

  return res.json(updated);
});
