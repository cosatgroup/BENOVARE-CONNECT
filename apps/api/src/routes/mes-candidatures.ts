import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { getTalentProfileForUser } from "../lib/talent-context";

export const mesCandidaturesRouter = Router();

mesCandidaturesRouter.use(requireAuth, requireRole("TALENT"));

// §3.5 Suivi — statut de candidature en temps réel, avec bascule
// automatique vers le pilotage en cas d'acceptation (le besoin porte alors
// une Mission, créée par le Partenaire à la décision — cf. candidatures.ts).
mesCandidaturesRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const profile = await getTalentProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Aucun profil rattaché à ce compte" });
  }

  const candidatures = await prisma.candidature.findMany({
    where: { talentId: profile.id },
    include: {
      besoin: { include: { partenaireCompany: true, mission: true } },
      entretiens: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(candidatures);
});
