import { authRequest } from "./api";

export type StatutDevis = "EN_ATTENTE" | "PAYE" | "ANNULE";
export type MoyenPaiement = "KKIAPAY" | "FEDAPAY" | "VIREMENT_BANCAIRE";
export type TargetType = "TALENT" | "PRESTATAIRE" | "PARTENAIRE";

export interface Devis {
  id: string;
  formule: string;
  montant: number;
  devise: string;
  statut: StatutDevis;
  moyenPaiement: MoyenPaiement | null;
  referenceExterne: string | null;
  payeLe: string | null;
  codeLicence: string | null;
  codeUtilise: boolean;
  createdAt: string;
  talentProfile?: { nom: string; prenoms: string } | null;
  prestataireCompany?: { raisonSociale: string } | null;
  partenaireCompany?: { raisonSociale: string } | null;
}

export interface CibleDevis {
  id: string;
  nom?: string;
  prenoms?: string;
  raisonSociale?: string;
}

// Administrateur / Gestionnaire — création et suivi des devis.

export function listerCiblesDevis(type: TargetType) {
  return authRequest<CibleDevis[]>(`/api/devis/cibles/${type}`);
}

export function creerDevis(input: { targetType: TargetType; targetId: string; formule: string; montant: number }) {
  return authRequest<Devis>("/api/devis", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listerTousLesDevis() {
  return authRequest<Devis[]>("/api/devis");
}

export function confirmerVirement(devisId: string) {
  return authRequest<Devis>(`/api/devis/${devisId}/confirmer-virement`, { method: "POST" });
}

// Compte — Talent, Prestataire, Partenaire.

export function listerMesDevis() {
  return authRequest<Devis[]>("/api/devis/mes");
}

export function getKkiapayConfig() {
  return authRequest<{ publicKey: string; sandbox: boolean }>("/api/devis/kkiapay-config");
}

export function confirmerKkiapay(devisId: string, transactionId: string) {
  return authRequest<Devis>(`/api/devis/${devisId}/confirmer-kkiapay`, {
    method: "POST",
    body: JSON.stringify({ transactionId }),
  });
}

export function payerParFedapay(devisId: string) {
  return authRequest<{ url: string }>(`/api/devis/${devisId}/payer-fedapay`, { method: "POST" });
}

export function payerParVirement(devisId: string) {
  return authRequest<{ instructions: string }>(`/api/devis/${devisId}/payer-virement`, { method: "POST" });
}

export function activerCodeLicence(code: string) {
  return authRequest<{ activated: boolean; formule: string }>("/api/abonnement/activer", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}
