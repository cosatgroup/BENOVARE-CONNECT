import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { construireEvenementWebhookFedapay } from "../lib/fedapay";
import { confirmerPaiementEtEnvoyerCode } from "../lib/licence";

// FedaPay signe le corps brut de la requête — cette route doit être montée
// dans server.ts avec express.raw() au lieu du express.json() global, sinon
// la signature ne correspondrait jamais.
export async function handleFedapayWebhook(req: Request, res: Response) {
  const signature = req.header("x-fedapay-signature");
  if (!signature) {
    return res.status(400).json({ error: "Signature manquante" });
  }

  let event;
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
    event = construireEvenementWebhookFedapay(rawBody, signature);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Signature webhook FedaPay invalide :", err);
    return res.status(400).json({ error: "Signature invalide" });
  }

  if (event.name === "transaction.approved") {
    const transaction = event.object as { id: number | string };
    const devis = await prisma.devis.findFirst({ where: { referenceExterne: String(transaction.id) } });
    if (devis) {
      await confirmerPaiementEtEnvoyerCode(devis.id, "FEDAPAY", String(transaction.id));
    }
  }

  return res.status(200).json({ received: true });
}

// KKiaPay ne documente pas de schéma de signature fiable pour son webhook ;
// on ne s'en sert que comme déclencheur best-effort — la confirmation
// faisant autorité reste l'appel client authentifié POST /devis/:id/confirmer-kkiapay
// qui revérifie systématiquement auprès de l'API KKiaPay.
export async function handleKkiapayWebhook(_req: Request, res: Response) {
  return res.status(200).json({ received: true });
}
