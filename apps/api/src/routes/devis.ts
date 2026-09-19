import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { verifierTransactionKkiapay } from "../lib/kkiapay";
import { creerTransactionFedapay } from "../lib/fedapay";
import { confirmerPaiementEtEnvoyerCode } from "../lib/licence";

export const devisRouter = Router();

devisRouter.use(requireAuth);

// ---------------------------------------------------------------------------
// Gestion — Administrateur ou Gestionnaire de compte (§7.4).
// ---------------------------------------------------------------------------

const cibleParType = {
  TALENT: () => prisma.talentProfile.findMany({ select: { id: true, nom: true, prenoms: true } }),
  PRESTATAIRE: () => prisma.prestataireCompany.findMany({ select: { id: true, raisonSociale: true } }),
  PARTENAIRE: () => prisma.partenaireCompany.findMany({ select: { id: true, raisonSociale: true } }),
} as const;

devisRouter.get(
  "/cibles/:type",
  requireRole("ADMINISTRATEUR", "GESTIONNAIRE"),
  async (req: AuthenticatedRequest, res) => {
    const type = String(req.params.type).toUpperCase() as keyof typeof cibleParType;
    const fetcher = cibleParType[type];
    if (!fetcher) {
      return res.status(400).json({ error: "Type de cible invalide" });
    }
    return res.json(await fetcher());
  }
);

const creerDevisSchema = z.object({
  targetType: z.enum(["TALENT", "PRESTATAIRE", "PARTENAIRE"]),
  targetId: z.string(),
  formule: z.string().min(1),
  montant: z.number().int().positive(),
});

devisRouter.post("/", requireRole("ADMINISTRATEUR", "GESTIONNAIRE"), async (req: AuthenticatedRequest, res) => {
  const parsed = creerDevisSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { targetType, targetId, formule, montant } = parsed.data;

  const data = {
    formule,
    montant,
    creeParUserId: req.auth!.userId,
    talentProfileId: targetType === "TALENT" ? targetId : undefined,
    prestataireCompanyId: targetType === "PRESTATAIRE" ? targetId : undefined,
    partenaireCompanyId: targetType === "PARTENAIRE" ? targetId : undefined,
  };

  const devis = await prisma.devis.create({ data });
  return res.status(201).json(devis);
});

devisRouter.get("/", requireRole("ADMINISTRATEUR", "GESTIONNAIRE"), async (_req: AuthenticatedRequest, res) => {
  const devis = await prisma.devis.findMany({
    include: { talentProfile: true, prestataireCompany: true, partenaireCompany: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json(devis);
});

devisRouter.post(
  "/:id/confirmer-virement",
  requireRole("ADMINISTRATEUR", "GESTIONNAIRE"),
  async (req: AuthenticatedRequest, res) => {
    const devis = await prisma.devis.findUnique({ where: { id: String(req.params.id) } });
    if (!devis) {
      return res.status(404).json({ error: "Devis introuvable" });
    }
    const updated = await confirmerPaiementEtEnvoyerCode(devis.id, "VIREMENT_BANCAIRE");
    return res.json(updated);
  }
);

// ---------------------------------------------------------------------------
// Côté compte — Talent, Prestataire, Partenaire.
// ---------------------------------------------------------------------------

async function getCibleCourante(req: AuthenticatedRequest) {
  if (req.auth!.role === "TALENT") {
    const profile = await prisma.talentProfile.findUnique({ where: { userId: req.auth!.userId } });
    return profile ? { talentProfileId: profile.id } : null;
  }
  if (req.auth!.role === "PRESTATAIRE") {
    const company = await prisma.prestataireCompany.findFirst({
      where: { membres: { some: { userId: req.auth!.userId } } },
    });
    return company ? { prestataireCompanyId: company.id } : null;
  }
  if (req.auth!.role === "PARTENAIRE") {
    const company = await prisma.partenaireCompany.findFirst({
      where: { membres: { some: { userId: req.auth!.userId } } },
    });
    return company ? { partenaireCompanyId: company.id } : null;
  }
  return null;
}

devisRouter.get(
  "/mes",
  requireRole("TALENT", "PRESTATAIRE", "PARTENAIRE"),
  async (req: AuthenticatedRequest, res) => {
    const cible = await getCibleCourante(req);
    if (!cible) {
      return res.status(404).json({ error: "Aucun profil rattaché à ce compte" });
    }
    const devis = await prisma.devis.findMany({ where: cible, orderBy: { createdAt: "desc" } });
    return res.json(devis);
  }
);

devisRouter.get(
  "/kkiapay-config",
  requireRole("TALENT", "PRESTATAIRE", "PARTENAIRE"),
  async (_req: AuthenticatedRequest, res) => {
    const publicKey = process.env.KKIAPAY_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(503).json({ error: "Paiement KKiaPay non configuré" });
    }
    return res.json({ publicKey, sandbox: process.env.KKIAPAY_SANDBOX !== "false" });
  }
);

async function assertDevisAppartientAuCompte(req: AuthenticatedRequest, devisId: string) {
  const cible = await getCibleCourante(req);
  if (!cible) return null;
  return prisma.devis.findFirst({ where: { id: devisId, ...cible } });
}

const confirmerKkiapaySchema = z.object({ transactionId: z.string() });

devisRouter.post(
  "/:id/confirmer-kkiapay",
  requireRole("TALENT", "PRESTATAIRE", "PARTENAIRE"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = confirmerKkiapaySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const devis = await assertDevisAppartientAuCompte(req, String(req.params.id));
    if (!devis) {
      return res.status(404).json({ error: "Devis introuvable" });
    }
    if (devis.statut === "PAYE") {
      return res.json(devis);
    }

    try {
      const verification = await verifierTransactionKkiapay(parsed.data.transactionId);
      if (!verification.isPaymentSucces || verification.amount < devis.montant) {
        return res.status(402).json({ error: "Paiement non confirmé par KKiaPay" });
      }
    } catch (err) {
      return res.status(502).json({ error: err instanceof Error ? err.message : "Échec de la vérification KKiaPay" });
    }

    const updated = await confirmerPaiementEtEnvoyerCode(devis.id, "KKIAPAY", parsed.data.transactionId);
    return res.json(updated);
  }
);

devisRouter.post(
  "/:id/payer-fedapay",
  requireRole("TALENT", "PRESTATAIRE", "PARTENAIRE"),
  async (req: AuthenticatedRequest, res) => {
    const devis = await assertDevisAppartientAuCompte(req, String(req.params.id));
    if (!devis) {
      return res.status(404).json({ error: "Devis introuvable" });
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });
    const webOrigin = (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",")[0];

    try {
      const { transactionId, url } = await creerTransactionFedapay({
        montant: devis.montant,
        description: `Abonnement Benovare Connect — formule ${devis.formule}`,
        email: user.email,
        callbackUrl: `${webOrigin}/abonnement/retour-paiement?devis=${devis.id}`,
      });

      await prisma.devis.update({ where: { id: devis.id }, data: { referenceExterne: transactionId } });
      return res.json({ url });
    } catch (err) {
      return res.status(502).json({ error: err instanceof Error ? err.message : "Échec de l'initialisation FedaPay" });
    }
  }
);

devisRouter.post(
  "/:id/payer-virement",
  requireRole("TALENT", "PRESTATAIRE", "PARTENAIRE"),
  async (req: AuthenticatedRequest, res) => {
    const devis = await assertDevisAppartientAuCompte(req, String(req.params.id));
    if (!devis) {
      return res.status(404).json({ error: "Devis introuvable" });
    }

    await prisma.devis.update({ where: { id: devis.id }, data: { moyenPaiement: "VIREMENT_BANCAIRE" } });

    const instructions =
      process.env.BANK_TRANSFER_INSTRUCTIONS ??
      "Contactez Benovare pour obtenir les coordonnées bancaires (RIB) et la référence à indiquer sur votre virement.";
    return res.json({ instructions });
  }
);
