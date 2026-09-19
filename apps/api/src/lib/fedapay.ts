import { FedaPay, Transaction, Webhook } from "fedapay";

function configure() {
  const apiKey = process.env.FEDAPAY_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Configuration FedaPay manquante (FEDAPAY_SECRET_KEY)");
  }
  FedaPay.setApiKey(apiKey);
  FedaPay.setEnvironment(process.env.FEDAPAY_ENVIRONMENT === "live" ? "live" : "sandbox");
}

// Crée une transaction puis génère son token de paiement — l'URL renvoyée
// est celle vers laquelle rediriger le client pour finaliser le paiement
// (Mobile Money ou carte) sur la page hébergée par FedaPay.
export async function creerTransactionFedapay(params: {
  montant: number;
  description: string;
  email: string;
  callbackUrl: string;
}): Promise<{ transactionId: string; url: string }> {
  configure();

  const transaction = await Transaction.create({
    description: params.description,
    amount: params.montant,
    currency: { iso: "XOF" },
    callback_url: params.callbackUrl,
    customer: { email: params.email },
  });

  const tokenResponse = await transaction.generateToken();

  return { transactionId: String(transaction.id), url: tokenResponse.url };
}

export async function recupererTransactionFedapay(transactionId: string) {
  configure();
  return Transaction.retrieve(transactionId);
}

export function construireEvenementWebhookFedapay(payload: string, signatureHeader: string) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Configuration FedaPay manquante (FEDAPAY_WEBHOOK_SECRET)");
  }
  return Webhook.constructEvent(payload, signatureHeader, secret);
}
