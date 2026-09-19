import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import type { PalierEtoiles, FormulePartenaire } from "@prisma/client";

export const abonnementRouter = Router();

abonnementRouter.use(requireAuth);

const activerSchema = z.object({ code: z.string().min(1) });

// §7.4 — Le code de licence reçu par e-mail après paiement d'un devis est
// saisi manuellement ici par le titulaire du compte (pas d'activation
// automatique) pour appliquer la formule souscrite à son abonnement.
abonnementRouter.post(
  "/activer",
  requireRole("TALENT", "PRESTATAIRE", "PARTENAIRE"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = activerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const code = parsed.data.code.trim().toUpperCase();

    if (req.auth!.role === "TALENT") {
      const profile = await prisma.talentProfile.findUnique({ where: { userId: req.auth!.userId } });
      if (!profile) {
        return res.status(404).json({ error: "Profil talent introuvable" });
      }
      const devis = await prisma.devis.findFirst({
        where: { codeLicence: code, codeUtilise: false, statut: "PAYE", talentProfileId: profile.id },
      });
      if (!devis) {
        return res.status(404).json({ error: "Code invalide, déjà utilisé, ou ne correspondant pas à ce compte" });
      }
      const subscription = await prisma.subscription.upsert({
        where: { id: profile.subscriptionId ?? "__none__" },
        update: { palierEtoiles: devis.formule as PalierEtoiles, status: "ACTIVE" },
        create: { palierEtoiles: devis.formule as PalierEtoiles, status: "ACTIVE" },
      });
      await prisma.$transaction([
        prisma.talentProfile.update({ where: { id: profile.id }, data: { subscriptionId: subscription.id } }),
        prisma.devis.update({ where: { id: devis.id }, data: { codeUtilise: true, codeUtiliseLe: new Date() } }),
      ]);
      return res.json({ activated: true, formule: devis.formule });
    }

    if (req.auth!.role === "PRESTATAIRE") {
      const company = await prisma.prestataireCompany.findFirst({
        where: { membres: { some: { userId: req.auth!.userId } } },
      });
      if (!company) {
        return res.status(404).json({ error: "Entreprise prestataire introuvable" });
      }
      const devis = await prisma.devis.findFirst({
        where: { codeLicence: code, codeUtilise: false, statut: "PAYE", prestataireCompanyId: company.id },
      });
      if (!devis) {
        return res.status(404).json({ error: "Code invalide, déjà utilisé, ou ne correspondant pas à ce compte" });
      }
      const subscription = await prisma.subscription.upsert({
        where: { id: company.subscriptionId ?? "__none__" },
        update: { palierEtoiles: devis.formule as PalierEtoiles, status: "ACTIVE" },
        create: { palierEtoiles: devis.formule as PalierEtoiles, status: "ACTIVE" },
      });
      await prisma.$transaction([
        prisma.prestataireCompany.update({ where: { id: company.id }, data: { subscriptionId: subscription.id } }),
        prisma.devis.update({ where: { id: devis.id }, data: { codeUtilise: true, codeUtiliseLe: new Date() } }),
      ]);
      return res.json({ activated: true, formule: devis.formule });
    }

    const company = await prisma.partenaireCompany.findFirst({
      where: { membres: { some: { userId: req.auth!.userId } } },
    });
    if (!company) {
      return res.status(404).json({ error: "Entreprise partenaire introuvable" });
    }
    const devis = await prisma.devis.findFirst({
      where: { codeLicence: code, codeUtilise: false, statut: "PAYE", partenaireCompanyId: company.id },
    });
    if (!devis) {
      return res.status(404).json({ error: "Code invalide, déjà utilisé, ou ne correspondant pas à ce compte" });
    }
    const subscription = await prisma.subscription.upsert({
      where: { id: company.subscriptionId ?? "__none__" },
      update: { formulePartenaire: devis.formule as FormulePartenaire, status: "ACTIVE" },
      create: { formulePartenaire: devis.formule as FormulePartenaire, status: "ACTIVE" },
    });
    await prisma.$transaction([
      prisma.partenaireCompany.update({ where: { id: company.id }, data: { subscriptionId: subscription.id } }),
      prisma.devis.update({ where: { id: devis.id }, data: { codeUtilise: true, codeUtiliseLe: new Date() } }),
    ]);
    return res.json({ activated: true, formule: devis.formule });
  }
);
