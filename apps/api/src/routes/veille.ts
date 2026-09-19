import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { collecterOpportunitesExternes } from "../lib/veille-ingestion";
import { VEILLE_SOURCES } from "../lib/veille-sources";
import { verifyAuthToken } from "../lib/jwt";

export const veilleRouter = Router();

// Déclenchement de la collecte — soit par un Administrateur authentifié,
// soit par un déclencheur externe (cron-job.org ou équivalent, faute de
// Cron Jobs Render sur le plan gratuit) muni du secret partagé
// VEILLE_CRON_SECRET, envoyé dans l'en-tête x-cron-secret.
veilleRouter.post("/collecter", async (req: AuthenticatedRequest, res) => {
  const cronSecret = process.env.VEILLE_CRON_SECRET;
  const providedSecret = req.headers["x-cron-secret"];
  const isCronAuthorized = Boolean(cronSecret) && providedSecret === cronSecret;

  if (!isCronAuthorized) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authentification ou secret de collecte requis" });
    }
    try {
      const payload = verifyAuthToken(authHeader.replace("Bearer ", ""));
      if (payload.role !== "ADMINISTRATEUR") {
        return res.status(403).json({ error: "Accès refusé pour ce rôle" });
      }
    } catch {
      return res.status(401).json({ error: "Jeton invalide ou expiré" });
    }
  }

  const resultats = await collecterOpportunitesExternes();
  return res.json({ sources: VEILLE_SOURCES.map((s) => s.nom), resultats });
});

veilleRouter.get(
  "/",
  requireAuth,
  requireRole("ADMINISTRATEUR"),
  async (req: AuthenticatedRequest, res) => {
    const statut = req.query.statut as string | undefined;
    const opportunites = await prisma.opportuniteExterne.findMany({
      where: statut ? { statutModeration: statut as "EN_ATTENTE" | "APPROUVEE" | "REJETEE" } : undefined,
      orderBy: { collecteeLe: "desc" },
      take: 100,
    });
    return res.json(opportunites);
  }
);

const modererSchema = z.object({ decision: z.enum(["APPROUVEE", "REJETEE"]) });

veilleRouter.post(
  "/:id/moderer",
  requireAuth,
  requireRole("ADMINISTRATEUR"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = modererSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const opportunite = await prisma.opportuniteExterne.update({
      where: { id: String(req.params.id) },
      data: { statutModeration: parsed.data.decision },
    });
    return res.json(opportunite);
  }
);

// Consultation par les Talents uniquement — annonces approuvées,
// identifiées comme « source externe » (§3.6).
veilleRouter.get(
  "/publiees",
  requireAuth,
  requireRole("TALENT"),
  async (_req: AuthenticatedRequest, res) => {
    const opportunites = await prisma.opportuniteExterne.findMany({
      where: { statutModeration: "APPROUVEE" },
      orderBy: { publieLe: "desc" },
      take: 50,
    });
    return res.json(opportunites);
  }
);
