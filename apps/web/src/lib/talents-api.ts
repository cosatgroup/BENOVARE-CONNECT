import { authRequest } from "./api";

export interface TalentProfile {
  id: string;
  nom: string;
  prenoms: string;
  linkedin: string | null;
  adresse: string | null;
  verifie: boolean;
  badgeMerite: boolean;
  profilUnicorn: boolean;
  disponibilite: "IMMEDIATE" | "A_PARTIR_DE";
  modalite: "TEMPS_PLEIN" | "TEMPS_PARTIEL";
  trustScore: number;
  subscription: { palierEtoiles: string | null; prochainRenouvellement: string | null } | null;
  competences: { id: string; nom: string }[];
  domainesExpertise: { id: string; nom: string }[];
}

export interface OnboardingTalentInput {
  nom: string;
  prenoms: string;
  linkedin?: string;
  adresse?: string;
  disponibilite?: "IMMEDIATE" | "A_PARTIR_DE";
  modalite?: "TEMPS_PLEIN" | "TEMPS_PARTIEL";
  domainesExpertise?: string[];
  competences?: string[];
}

export function getMonProfil() {
  return authRequest<TalentProfile>("/api/talents/me");
}

export function creerProfil(input: OnboardingTalentInput) {
  return authRequest<TalentProfile>("/api/talents/onboarding", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface OpportuniteBesoin {
  id: string;
  titre: string;
  description: string;
  niveauEtoiles: number;
  categorieTechnique: string | null;
  createdAt: string;
  partenaireCompany: { raisonSociale: string } | null;
  entrepriseClienteNom: string | null;
}

export function listerOpportunites() {
  return authRequest<{ avisPartenaires: OpportuniteBesoin[]; avisPrestataires: OpportuniteBesoin[] }>(
    "/api/opportunites"
  );
}

export function getOpportunite(id: string) {
  return authRequest<OpportuniteBesoin & { maCandidature: { id: string; statut: string } | null }>(
    `/api/opportunites/${id}`
  );
}

export function candidater(id: string, messageMotive?: string) {
  return authRequest(`/api/opportunites/${id}/candidater`, {
    method: "POST",
    body: JSON.stringify({ messageMotive }),
  });
}

export interface MaCandidature {
  id: string;
  statut: "SOUMISE" | "PRESELECTIONNEE" | "ENTRETIEN_PLANIFIE" | "ENTRETIEN_FINAL" | "ACCEPTEE" | "REFUSEE";
  besoin: OpportuniteBesoin & { mission: { id: string } | null };
  entretiens: { type: string; resultat: string }[];
  createdAt: string;
}

export function listerMesCandidatures() {
  return authRequest<MaCandidature[]>("/api/mes-candidatures");
}

export interface TalentMission {
  id: string;
  statut: "EN_COURS" | "CLOTUREE_CONFORME" | "CLOTUREE_AVEC_RESERVE" | "CLOTUREE_LITIGE";
  besoin: OpportuniteBesoin;
  jalons: { id: string; nom: string; ordre: number; statut: "A_VENIR" | "EN_COURS" | "TERMINE" }[];
  livrables?: { id: string; nom: string; deposeLe: string; valide: boolean }[];
  demandes?: {
    id: string;
    type: "DELAI" | "AVENANT";
    motif: string;
    statut: "EN_ATTENTE" | "VALIDEE" | "REFUSEE";
    createdAt: string;
  }[];
  messages?: { id: string; contenu: string; createdAt: string; author: { email: string; role: string } }[];
}

export function listerMesMissions() {
  return authRequest<TalentMission[]>("/api/talents/missions");
}

export function getMaMission(id: string) {
  return authRequest<TalentMission>(`/api/talents/missions/${id}`);
}

export function declarerImprevu(missionId: string, type: "DELAI" | "AVENANT", motif: string, dureeJours?: number) {
  return authRequest(`/api/talents/missions/${missionId}/demandes`, {
    method: "POST",
    body: JSON.stringify({ type, motif, dureeJours }),
  });
}

export function envoyerMessageMission(missionId: string, contenu: string) {
  return authRequest(`/api/talents/missions/${missionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ contenu }),
  });
}
