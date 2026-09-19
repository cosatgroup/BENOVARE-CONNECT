import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { getPartenaireCompanyForUser } from "../lib/partenaire-context";

export const besoinsRouter = Router();

besoinsRouter.use(requireAuth);

const besoinSchema = z.object({
  type: z.enum(["RECRUTEMENT_TALENT", "RECRUTEMENT_PRESTATAIRE", "CONSEIL_AUDIT"]),
  titre: z.string().min(3),
  description: z.string().min(10),
  niveauEtoiles: z.number().int().min(1).max(4),
  categorieTechnique: z.string().optional(),
  budgetIndicatif: z.string().optional(),
  delaiSouhaite: z.string().optional(),
  niveauAccompagnement: z
    .enum(["MISE_EN_RELATION_SIMPLE", "COORDINATION_ENTRETIENS", "ACCOMPAGNEMENT_COMPLET"])
    .default("MISE_EN_RELATION_SIMPLE"),
  criteresSoumission: z.array(z.string()).default([]),
});

// §5.3 — Publier un besoin. Recrutement de talent → visible dans
// Opportunités des Talents ; recrutement de prestataire → catalogue Projets
// des Prestataires ; conseil & audit → menu dédié.
besoinsRouter.post("/", requireRole("PARTENAIRE"), async (req: AuthenticatedRequest, res) => {
  const parsed = besoinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const company = await getPartenaireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const besoin = await prisma.besoin.create({
    data: { ...parsed.data, partenaireCompanyId: company.id },
  });

  return res.status(201).json(besoin);
});

// Liste des besoins du Partenaire connecté, avec le nombre de candidatures.
besoinsRouter.get("/", requireRole("PARTENAIRE"), async (req: AuthenticatedRequest, res) => {
  const company = await getPartenaireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const besoins = await prisma.besoin.findMany({
    // Exclut les avis de recherche de talents publiés par un Prestataire
    // sur une mission de ce Partenaire (§4.5) — pas des besoins qu'il gère.
    where: { partenaireCompanyId: company.id, prestataireCompanyId: null },
    include: { _count: { select: { candidatures: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json(besoins);
});

besoinsRouter.get("/:id", requireRole("PARTENAIRE"), async (req: AuthenticatedRequest, res) => {
  const company = await getPartenaireCompanyForUser(req.auth!.userId);
  if (!company) {
    return res.status(404).json({ error: "Aucune entreprise rattachée à ce compte" });
  }

  const besoin = await prisma.besoin.findFirst({
    where: { id: String(req.params.id), partenaireCompanyId: company.id },
    include: {
      candidatures: {
        include: { talent: true, prestataireCompany: true, entretiens: true },
        orderBy: { createdAt: "desc" },
      },
      mission: true,
    },
  });
  if (!besoin) {
    return res.status(404).json({ error: "Besoin introuvable" });
  }

  return res.json(besoin);
});
