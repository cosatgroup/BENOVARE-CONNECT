import { authRequest } from "./api";

export interface OpportuniteExterne {
  id: string;
  titre: string;
  description: string;
  url: string;
  source: string;
  publieLe: string | null;
  statutModeration: "EN_ATTENTE" | "APPROUVEE" | "REJETEE";
  collecteeLe: string;
}

export function listerVeilleAdmin(statut?: "EN_ATTENTE" | "APPROUVEE" | "REJETEE") {
  const query = statut ? `?statut=${statut}` : "";
  return authRequest<OpportuniteExterne[]>(`/api/veille${query}`);
}

export function modererVeille(id: string, decision: "APPROUVEE" | "REJETEE") {
  return authRequest<OpportuniteExterne>(`/api/veille/${id}/moderer`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}

export interface CollecteResult {
  source: string;
  trouvees: number;
  nouvelles: number;
  erreur?: string;
}

export function lancerCollecte() {
  return authRequest<{ sources: string[]; resultats: CollecteResult[] }>("/api/veille/collecter", {
    method: "POST",
  });
}

export function listerVeillePubliee() {
  return authRequest<OpportuniteExterne[]>("/api/veille/publiees");
}
