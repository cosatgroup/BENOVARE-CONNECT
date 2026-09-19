import type { SubscriptionStatus } from "@prisma/client";

// §7.4 — Tout compte Talent/Prestataire/Partenaire dispose de 30 jours
// d'essai gratuit à compter de son inscription. Passé ce délai, l'accès aux
// fonctionnalités est coupé tant qu'un abonnement payant n'a pas été activé
// (par code de licence) : seuls l'espace Abonnement et le contact Benovare
// restent joignables.
export const DUREE_ESSAI_JOURS = 30;

export function dateFinEssai(createdAt: Date): Date {
  const fin = new Date(createdAt);
  fin.setDate(fin.getDate() + DUREE_ESSAI_JOURS);
  return fin;
}

export function estEnEssai(createdAt: Date): boolean {
  return new Date() < dateFinEssai(createdAt);
}

export function aAccesActif(createdAt: Date, statutAbonnement: SubscriptionStatus | null | undefined): boolean {
  if (statutAbonnement === "ACTIVE") return true;
  return estEnEssai(createdAt);
}
