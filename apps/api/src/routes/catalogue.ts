import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

// §7.5 — Lecture des référentiels de catalogue/taxonomie, ouverte à tout
// compte authentifié (les formulaires d'onboarding Talent et de publication
// de besoin Partenaire s'y appuient pour suggérer des valeurs harmonisées).
// La gestion (création/suppression) reste réservée à l'Administrateur, voir
// /api/administrateur/catalogue/*.
export const catalogueRouter = Router();

catalogueRouter.use(requireAuth);

catalogueRouter.get("/domaines-expertise", async (_req, res) => {
  const domaines = await prisma.domaineExpertise.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true } });
  return res.json(domaines);
});

catalogueRouter.get("/categories-techniques", async (_req, res) => {
  const categories = await prisma.categorieTechnique.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true } });
  return res.json(categories);
});
