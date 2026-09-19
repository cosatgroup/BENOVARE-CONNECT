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
  partenaireCompanyId?: string;
  entrepriseClienteNom?: string;
  categorieTechnique?: string;
}

export interface PartenaireOption {
  id: string;
  raisonSociale: string;
}

// Gestion — Administrateur / Gestionnaire de compte.
export function creerPlacement(input: CreerPlacementInput) {
  return authRequest<Placement>("/api/placements", { method: "POST", body: JSON.stringify(input) });
}

export function listerPlacements() {
  return authRequest<Placement[]>("/api/placements");
}

export function listerPartenairesPourPlacement() {
  return authRequest<PartenaireOption[]>("/api/placements/partenaires");
}

// Consultation — Talents / Prestataires.
export function listerPlacementsTalents() {
  return authRequest<Placement[]>("/api/placements/talents");
}

export function listerPlacementsPrestataires() {
  return authRequest<Placement[]>("/api/placements/prestataires");
}
