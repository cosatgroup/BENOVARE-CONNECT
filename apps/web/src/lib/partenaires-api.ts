import { authRequest } from "./api";

export interface PartenaireCompany {
  id: string;
  raisonSociale: string;
  secteurActivite: string | null;
  coordonnees: string | null;
  verifieKYB: boolean;
  subscription: { formulePartenaire: string | null; prochainRenouvellement: string | null } | null;
  membres: { id: string; nom: string; role: string }[];
}

export function getMonEntreprise() {
  return authRequest<PartenaireCompany>("/api/partenaires/me");
}

export interface OnboardingInput {
  raisonSociale: string;
  secteurActivite?: string;
  coordonnees?: string;
}

export function creerEntreprise(input: OnboardingInput) {
  return authRequest<PartenaireCompany>("/api/partenaires/onboarding", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type TypeBesoin = "RECRUTEMENT_TALENT" | "RECRUTEMENT_PRESTATAIRE" | "CONSEIL_AUDIT";
export type NiveauAccompagnement =
  | "MISE_EN_RELATION_SIMPLE"
  | "COORDINATION_ENTRETIENS"
  | "ACCOMPAGNEMENT_COMPLET";

export interface Besoin {
  id: string;
  type: TypeBesoin;
  titre: string;
  description: string;
  niveauEtoiles: number;
  categorieTechnique: string | null;
  budgetIndicatif: string | null;
  delaiSouhaite: string | null;
  niveauAccompagnement: NiveauAccompagnement;
  statut: "OUVERT" | "EN_EVALUATION" | "CLOS";
  createdAt: string;
  _count?: { candidatures: number };
}

export interface PublierBesoinInput {
  type: TypeBesoin;
  titre: string;
  description: string;
  niveauEtoiles: number;
  categorieTechnique?: string;
  budgetIndicatif?: string;
  delaiSouhaite?: string;
  niveauAccompagnement?: NiveauAccompagnement;
  criteresSoumission?: string[];
}

export function listerBesoins() {
  return authRequest<Besoin[]>("/api/besoins");
}

export function publierBesoin(input: PublierBesoinInput) {
  return authRequest<Besoin>("/api/besoins", { method: "POST", body: JSON.stringify(input) });
}

export function getBesoin(id: string) {
  return authRequest<
    Besoin & { candidatures: Candidature[]; mission: { id: string } | null }
  >(`/api/besoins/${id}`);
}

export interface Candidature {
  id: string;
  statut: "SOUMISE" | "PRESELECTIONNEE" | "ENTRETIEN_PLANIFIE" | "ENTRETIEN_FINAL" | "ACCEPTEE" | "REFUSEE";
  besoin?: Besoin;
  talent: { id: string; nom: string; prenoms: string; trustScore: number } | null;
  prestataireCompany: { id: string; raisonSociale: string; trustScore: number } | null;
  entretiens: {
    id: string;
    type: "PREMIER_ENTRETIEN_BENOVARE" | "ENTRETIEN_FINAL_PARTENAIRE";
    resultat: "EN_ATTENTE" | "FAVORABLE" | "DEFAVORABLE";
    compteRendu: string | null;
  }[];
  messageMotive: string | null;
  createdAt: string;
}

export function listerCandidatures() {
  return authRequest<Candidature[]>("/api/candidatures");
}

export function decisionCandidature(id: string, decision: "ACCEPTEE" | "REFUSEE", messageMotive?: string) {
  return authRequest<Candidature>(`/api/candidatures/${id}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision, messageMotive }),
  });
}

export interface Jalon {
  id: string;
  nom: string;
  ordre: number;
  statut: "A_VENIR" | "EN_COURS" | "TERMINE";
  echeance: string | null;
}

export interface Livrable {
  id: string;
  nom: string;
  deposeLe: string;
  valide: boolean;
}

export interface DemandeAvenant {
  id: string;
  type: "DELAI" | "AVENANT";
  motif: string;
  dureeJours: number | null;
  declarationAnticipee: boolean;
  statut: "EN_ATTENTE" | "VALIDEE" | "REFUSEE";
  createdAt: string;
}

export interface MissionMessage {
  id: string;
  contenu: string;
  createdAt: string;
  author: { email: string; role: string };
}

export interface Mission {
  id: string;
  statut: "EN_COURS" | "CLOTUREE_CONFORME" | "CLOTUREE_AVEC_RESERVE" | "CLOTUREE_LITIGE";
  besoin: Besoin;
  jalons: Jalon[];
  livrables?: Livrable[];
  demandes?: DemandeAvenant[];
  messages?: MissionMessage[];
}

export function listerMissions() {
  return authRequest<Mission[]>("/api/missions");
}

export function getMission(id: string) {
  return authRequest<Mission>(`/api/missions/${id}`);
}

export function decisionDemande(missionId: string, demandeId: string, decision: "VALIDEE" | "REFUSEE") {
  return authRequest<DemandeAvenant>(`/api/missions/${missionId}/demandes/${demandeId}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}

export function envoyerMessage(missionId: string, contenu: string) {
  return authRequest<MissionMessage>(`/api/missions/${missionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ contenu }),
  });
}
