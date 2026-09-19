import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { getPrestataireCompanyForUser } from "../lib/prestataire-context";

export const mesSoumissionsRouter = Router();

mesSoumissionsRouter.use(requireAuth, requireRole("PRESTATAIRE"));

// §4.5 Suivi — statut de soumission en temps réel.
mesSoumissionsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const company = await getPrestataireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const soumissions = await prisma.candidature.findMany({
    where: { prestataireCompanyId: company.id },
    include: { besoin: { include: { partenaireCompany: true, mission: true } }, entretiens: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json(soumissions);
});
