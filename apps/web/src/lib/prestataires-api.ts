import { authRequest } from "./api";

export interface PrestataireCompany {
  id: string;
  raisonSociale: string;
  secteurActivite: string | null;
  effectif: number | null;
  anneeCreation: number | null;
  coordonnees: string | null;
  verifieKYB: boolean;
  badgeMerite: boolean;
  profilUnicorn: boolean;
  trustScore: number;
  subscription: { palierEtoiles: string | null; prochainRenouvellement: string | null } | null;
  membres: { id: string; nom: string; role: string }[];
}

export function getMonEntreprise() {
  return authRequest<PrestataireCompany>("/api/prestataires/me");
}

export interface OnboardingInput {
  raisonSociale: string;
  secteurActivite?: string;
  effectif?: number;
  anneeCreation?: number;
  coordonnees?: string;
}

export function creerEntreprise(input: OnboardingInput) {
  return authRequest<PrestataireCompany>("/api/prestataires/onboarding", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function choisirPalier(palierEtoiles: "SILVER" | "GOLD" | "PLATINUM") {
  return authRequest("/api/prestataires/subscription", {
    method: "POST",
    body: JSON.stringify({ palierEtoiles }),
  });
}

export interface ProjetBesoin {
  id: string;
  titre: string;
  description: string;
  niveauEtoiles: number;
  categorieTechnique: string | null;
  budgetIndicatif: string | null;
  criteresSoumission: string[];
  createdAt: string;
  partenaireCompany: { raisonSociale: string } | null;
}

export function listerProjets() {
  return authRequest<ProjetBesoin[]>("/api/projets");
}

export function getProjet(id: string) {
  return authRequest<ProjetBesoin & { maCandidature: { id: string; statut: string } | null }>(
    `/api/projets/${id}`
  );
}

export function soumettre(id: string, equipeProposee: string[]) {
  return authRequest(`/api/projets/${id}/soumettre`, {
    method: "POST",
    body: JSON.stringify({ equipeProposee }),
  });
}

export interface MaSoumission {
  id: string;
  statut: "SOUMISE" | "PRESELECTIONNEE" | "ENTRETIEN_PLANIFIE" | "ENTRETIEN_FINAL" | "ACCEPTEE" | "REFUSEE";
  equipeProposee: string[];
  besoin: ProjetBesoin & { mission: { id: string } | null };
  createdAt: string;
}

export function listerMesSoumissions() {
  return authRequest<MaSoumission[]>("/api/mes-soumissions");
}

export interface PrestataireMission {
  id: string;
  statut: "EN_COURS" | "CLOTUREE_CONFORME" | "CLOTUREE_AVEC_RESERVE" | "CLOTUREE_LITIGE";
  besoin: ProjetBesoin;
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
  return authRequest<PrestataireMission[]>("/api/prestataires/missions");
}

export function getMaMission(id: string) {
  return authRequest<PrestataireMission>(`/api/prestataires/missions/${id}`);
}

export function declarerImprevu(missionId: string, type: "DELAI" | "AVENANT", motif: string, dureeJours?: number) {
  return authRequest(`/api/prestataires/missions/${missionId}/demandes`, {
    method: "POST",
    body: JSON.stringify({ type, motif, dureeJours }),
  });
}

export function envoyerMessageMission(missionId: string, contenu: string) {
  return authRequest(`/api/prestataires/missions/${missionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ contenu }),
  });
}

export function rechercherTalents(
  missionId: string,
  titre: string,
  description: string,
  niveauEtoiles: number,
  categorieTechnique?: string
) {
  return authRequest(`/api/prestataires/missions/${missionId}/rechercher-talents`, {
    method: "POST",
    body: JSON.stringify({ titre, description, niveauEtoiles, categorieTechnique }),
  });
}
