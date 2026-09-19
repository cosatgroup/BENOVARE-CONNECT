import { authRequest } from "./api";

export interface GestionnaireDashboard {
  candidaturesEnAttente: number;
  missionsActives: number;
  comptesAValider: number;
}

export function getDashboard() {
  return authRequest<GestionnaireDashboard>("/api/gestionnaire/dashboard");
}

export interface PipelineCandidature {
  id: string;
  statut: "SOUMISE" | "PRESELECTIONNEE" | "ENTRETIEN_PLANIFIE" | "ENTRETIEN_FINAL" | "ACCEPTEE" | "REFUSEE";
  besoin: { id: string; titre: string; partenaireCompany: { raisonSociale: string } | null };
  talent: { id: string; nom: string; prenoms: string; trustScore: number } | null;
  prestataireCompany: { id: string; raisonSociale: string; trustScore: number } | null;
  entretiens: { type: string; resultat: string; compteRendu: string | null }[];
  createdAt: string;
}

export function listerPipeline() {
  return authRequest<PipelineCandidature[]>("/api/gestionnaire/candidatures");
}

export function transmettrePremierEntretien(
  candidatureId: string,
  resultat: "FAVORABLE" | "DEFAVORABLE",
  compteRendu: string
) {
  return authRequest(`/api/gestionnaire/candidatures/${candidatureId}/entretien`, {
    method: "POST",
    body: JSON.stringify({ resultat, compteRendu }),
  });
}

export interface GestionnaireMission {
  id: string;
  statut: "EN_COURS" | "CLOTUREE_CONFORME" | "CLOTUREE_AVEC_RESERVE" | "CLOTUREE_LITIGE";
  besoin: { titre: string; partenaireCompany: { raisonSociale: string } | null };
  jalons: { id: string; nom: string; statut: string }[];
  demandes: { id: string; motif: string; statut: string; recommandationGestionnaire: string | null }[];
  livrables: { id: string; nom: string; valide: boolean }[];
}

export function listerMissionsGestionnaire() {
  return authRequest<GestionnaireMission[]>("/api/gestionnaire/missions");
}

export function getMissionGestionnaire(id: string) {
  return authRequest<GestionnaireMission>(`/api/gestionnaire/missions/${id}`);
}

export function recommanderDemande(missionId: string, demandeId: string, recommandation: string, complexite?: string) {
  return authRequest(`/api/gestionnaire/missions/${missionId}/demandes/${demandeId}/recommandation`, {
    method: "POST",
    body: JSON.stringify({ recommandation, complexite }),
  });
}

export function validerLivrable(missionId: string, livrableId: string) {
  return authRequest(`/api/gestionnaire/missions/${missionId}/livrables/${livrableId}/valider`, {
    method: "POST",
  });
}

export interface ComptesResponse {
  partenaires: { id: string; raisonSociale: string; verifieKYB: boolean }[];
  prestataires: { id: string; raisonSociale: string; verifieKYB: boolean }[];
  talents: { id: string; nom: string; prenoms: string; verifie: boolean }[];
}

export function listerComptes() {
  return authRequest<ComptesResponse>("/api/gestionnaire/comptes");
}

export function validerCompte(type: "partenaire" | "prestataire" | "talent", id: string) {
  return authRequest(`/api/gestionnaire/comptes/${type}/${id}/valider`, { method: "POST" });
}

export interface Reporting {
  delaiMoyenSelectionJours: number | null;
  missionsClotureesConformesPct: number | null;
  tauxSatisfactionPct: number | null;
  missionsActives: number;
  repartitionPortefeuille: { partenaires: number; talents: number; prestataires: number };
}

export function getReporting() {
  return authRequest<Reporting>("/api/gestionnaire/reporting");
}
