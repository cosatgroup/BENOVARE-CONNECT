import { authRequest } from "./api";

export interface Placement {
  id: string;
  type: "RECRUTEMENT_TALENT" | "RECRUTEMENT_PRESTATAIRE";
  titre: string;
  description: string;
  niveauEtoiles: number;
  categorieTechnique: string | null;
  entrepriseClienteNom: string | null;
  statut: "OUVERT" | "EN_EVALUATION" | "CLOS";
  createdAt: string;
  _count?: { candidatures: number };
  mission?: { id: string } | null;
}

export interface CreerPlacementInput {
  type: "RECRUTEMENT_TALENT" | "RECRUTEMENT_PRESTATAIRE";
  titre: string;
  description: string;
  niveauEtoiles: number;
  entrepriseClienteNom: string;
  categorieTechnique?: string;
}

// Gestion — Administrateur / Gestionnaire de compte.
export function creerPlacement(input: CreerPlacementInput) {
  return authRequest<Placement>("/api/placements", { method: "POST", body: JSON.stringify(input) });
}

export function listerPlacements() {
  return authRequest<Placement[]>("/api/placements");
}

// Consultation — Talents / Prestataires.
export function listerPlacementsTalents() {
  return authRequest<Placement[]>("/api/placements/talents");
}

export function listerPlacementsPrestataires() {
  return authRequest<Placement[]>("/api/placements/prestataires");
}
