import { Router } from "express";
import { prisma } from "../lib/prisma";
import { encryptSecret } from "../lib/crypto";

export const maintenanceRouter = Router();

// Format attendu d'un secret déjà chiffré : <iv hex>:<authTag hex>:<ciphertext hex>.
function isAlreadyEncrypted(value: string): boolean {
  return /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(value);
}

// Opération ponctuelle : les comptes créés avant l'introduction du
// chiffrement au repos du secret TOTP (mfaSecret) ont ce champ en clair,
// ce qui casse leur vérification MFA depuis ce changement. Rechiffre en
// place, sans recréer les comptes. Protégée par un secret dédié plutôt que
// par un rôle applicatif, précisément parce que le problème touche
// potentiellement tous les comptes Administrateur eux-mêmes.
maintenanceRouter.post("/reencrypt-secrets", async (req, res) => {
  const providedSecret = req.headers["x-maintenance-secret"];
  const expectedSecret = process.env.MAINTENANCE_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return res.status(401).json({ error: "Secret de maintenance invalide" });
  }

  const users = await prisma.user.findMany({
    where: { mfaSecret: { not: null } },
    select: { id: true, mfaSecret: true },
  });

  let reencrypted = 0;
  for (const user of users) {
    if (!user.mfaSecret || isAlreadyEncrypted(user.mfaSecret)) continue;
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaSecret: encryptSecret(user.mfaSecret) },
    });
    reencrypted += 1;
  }

  return res.json({ total: users.length, reencrypted });
});

// Active un abonnement de démonstration (accès complet, sans passer par le
// paiement) pour un compte donné — usage ponctuel pour préparer des comptes
// de démo par console. Protégée par le même secret de maintenance.
maintenanceRouter.post("/activer-abonnement-demo", async (req, res) => {
  const providedSecret = req.headers["x-maintenance-secret"];
  const expectedSecret = process.env.MAINTENANCE_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return res.status(401).json({ error: "Secret de maintenance invalide" });
  }

  const { email, formule } = req.body as { email?: string; formule?: string };
  if (!email || !formule) {
    return res.status(400).json({ error: "email et formule requis" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      talentProfile: true,
      prestataireMember: { include: { company: true } },
      partenaireMember: { include: { company: true } },
    },
  });
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable" });
  }

  if (user.role === "TALENT" && user.talentProfile) {
    const subscription = user.talentProfile.subscriptionId
      ? await prisma.subscription.update({
          where: { id: user.talentProfile.subscriptionId },
          data: { palierEtoiles: formule as never, status: "ACTIVE" },
        })
      : await prisma.subscription.create({ data: { palierEtoiles: formule as never, status: "ACTIVE" } });
    await prisma.talentProfile.update({
      where: { id: user.talentProfile.id },
      data: { subscriptionId: subscription.id },
    });
    return res.json({ activated: true, role: user.role, formule });
  }

  if (user.role === "PRESTATAIRE" && user.prestataireMember) {
    const company = user.prestataireMember.company;
    const subscription = company.subscriptionId
      ? await prisma.subscription.update({
          where: { id: company.subscriptionId },
          data: { palierEtoiles: formule as never, status: "ACTIVE" },
        })
      : await prisma.subscription.create({ data: { palierEtoiles: formule as never, status: "ACTIVE" } });
    await prisma.prestataireCompany.update({ where: { id: company.id }, data: { subscriptionId: subscription.id } });
    return res.json({ activated: true, role: user.role, formule });
  }

  if (user.role === "PARTENAIRE" && user.partenaireMember) {
    const company = user.partenaireMember.company;
    const subscription = company.subscriptionId
      ? await prisma.subscription.update({
          where: { id: company.subscriptionId },
          data: { formulePartenaire: formule as never, status: "ACTIVE" },
        })
      : await prisma.subscription.create({ data: { formulePartenaire: formule as never, status: "ACTIVE" } });
    await prisma.partenaireCompany.update({ where: { id: company.id }, data: { subscriptionId: subscription.id } });
    return res.json({ activated: true, role: user.role, formule });
  }

  return res.status(409).json({ error: "Aucun profil/entreprise rattaché à ce compte pour ce rôle" });
});
