import { authRequest } from "./api";

export interface AdminDashboard {
  comptesActifsParType: { talents: number; prestataires: number; partenaires: number };
  missionsEnCours: number;
  missionsCloturees: number;
  litigesOuverts: number;
}

export function getDashboard() {
  return authRequest<AdminDashboard>("/api/administrateur/dashboard");
}

export interface AdminUser {
  id: string;
  email: string;
  role: "TALENT" | "PRESTATAIRE" | "PARTENAIRE" | "GESTIONNAIRE" | "ADMINISTRATEUR";
  status: "ACTIF" | "SUSPENDU" | "EN_ATTENTE_VALIDATION";
  createdAt: string;
  talentProfile: { nom: string; prenoms: string } | null;
  partenaireMember: { company: { raisonSociale: string; gestionnaireCompteId: string | null } } | null;
  prestataireMember: { company: { raisonSociale: string } } | null;
}

export function listerUtilisateurs() {
  return authRequest<AdminUser[]>("/api/administrateur/utilisateurs");
}

export interface CreerCompteInterneInput {
  email: string;
  password: string;
  role: "GESTIONNAIRE" | "ADMINISTRATEUR";
  nom: string;
}

export function creerCompteInterne(input: CreerCompteInterneInput) {
  return authRequest<{ id: string; email: string; role: string }>("/api/administrateur/utilisateurs/interne", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function changerStatut(userId: string, status: "ACTIF" | "SUSPENDU") {
  return authRequest(`/api/administrateur/utilisateurs/${userId}/statut`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export interface AdminGestionnaire {
  id: string;
  nom: string;
  user: { email: string };
}

export function listerGestionnaires() {
  return authRequest<AdminGestionnaire[]>("/api/administrateur/gestionnaires");
}

export interface AdminPartenaireCompany {
  id: string;
  raisonSociale: string;
  gestionnaireCompte: { id: string; nom: string; user: { email: string } } | null;
}

export function listerPartenairesPourAffectation() {
  return authRequest<AdminPartenaireCompany[]>("/api/administrateur/partenaires");
}

export function assignerGestionnaire(partenaireId: string, gestionnaireId: string | null) {
  return authRequest(`/api/administrateur/partenaires/${partenaireId}/assigner`, {
    method: "POST",
    body: JSON.stringify({ gestionnaireId }),
  });
}

export interface MeriteCandidats {
  talents: { id: string; nom: string; prenoms: string; trustScore: number; badgeMerite: boolean; profilUnicorn: boolean }[];
  prestataires: { id: string; raisonSociale: string; trustScore: number; badgeMerite: boolean; profilUnicorn: boolean }[];
}

export function listerCandidatsMerite() {
  return authRequest<MeriteCandidats>("/api/administrateur/merite/candidats");
}

export function definirMerite(
  type: "talent" | "prestataire",
  id: string,
  data: { badgeMerite?: boolean; profilUnicorn?: boolean }
) {
  return authRequest(`/api/administrateur/merite/${type}/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface DomaineExpertiseAdmin {
  id: string;
  nom: string;
  _count: { talents: number };
}

export interface CategorieTechniqueAdmin {
  id: string;
  nom: string;
}

export function listerDomainesExpertise() {
  return authRequest<DomaineExpertiseAdmin[]>("/api/administrateur/catalogue/domaines-expertise");
}

export function creerDomaineExpertise(nom: string) {
  return authRequest<DomaineExpertiseAdmin>("/api/administrateur/catalogue/domaines-expertise", {
    method: "POST",
    body: JSON.stringify({ nom }),
  });
}

export function supprimerDomaineExpertise(id: string) {
  return authRequest(`/api/administrateur/catalogue/domaines-expertise/${id}`, { method: "DELETE" });
}

export function listerCategoriesTechniques() {
  return authRequest<CategorieTechniqueAdmin[]>("/api/administrateur/catalogue/categories-techniques");
}

export function creerCategorieTechnique(nom: string) {
  return authRequest<CategorieTechniqueAdmin>("/api/administrateur/catalogue/categories-techniques", {
    method: "POST",
    body: JSON.stringify({ nom }),
  });
}

export function supprimerCategorieTechnique(id: string) {
  return authRequest(`/api/administrateur/catalogue/categories-techniques/${id}`, { method: "DELETE" });
}
