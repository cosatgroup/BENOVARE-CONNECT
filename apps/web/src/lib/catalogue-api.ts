import { authRequest } from "./api";

export interface CatalogueEntry {
  id: string;
  nom: string;
}

export function listerDomainesExpertise() {
  return authRequest<CatalogueEntry[]>("/api/catalogue/domaines-expertise");
}

export function listerCategoriesTechniques() {
  return authRequest<CatalogueEntry[]>("/api/catalogue/categories-techniques");
}
