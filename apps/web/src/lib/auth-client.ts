// Accès au jeton d'auth côté client. localStorage n'existe que dans le
// navigateur — ces fonctions ne doivent être appelées que depuis des
// composants "use client", jamais pendant le rendu serveur.
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
}
