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
