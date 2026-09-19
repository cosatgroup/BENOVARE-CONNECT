import { kkiapay } from "@kkiapay-org/nodejs-sdk";

// KKiaPay n'expose pas de création de paiement côté serveur : le paiement
// est initié par le widget JavaScript côté client (clé publique, montant),
// et confirmé ici en rejouant une vérification serveur-à-serveur avec la
// clé privée/secrète — on ne fait jamais confiance au seul callback client.
function getClient() {
  const privatekey = process.env.KKIAPAY_PRIVATE_KEY;
  const publickey = process.env.KKIAPAY_PUBLIC_KEY;
  const secretkey = process.env.KKIAPAY_SECRET_KEY;
  if (!privatekey || !publickey || !secretkey) {
    throw new Error("Configuration KKiaPay manquante (clés publique/privée/secrète)");
  }
  return kkiapay({
    privatekey,
    publickey,
    secretkey,
    sandbox: process.env.KKIAPAY_SANDBOX !== "false",
  });
}

export interface KkiapayVerification {
  isPaymentSucces: boolean;
  amount: number;
  transactionId: string;
}

export async function verifierTransactionKkiapay(transactionId: string): Promise<KkiapayVerification> {
  const client = getClient();
  return client.verify(transactionId);
}
