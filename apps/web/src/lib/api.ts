import { getAuthToken } from "./auth-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error ?? "Une erreur est survenue";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data as T;
}

// Requête authentifiée — ajoute le jeton MFA-vérifié émis à la connexion.
// Utilisée par toutes les consoles une fois l'utilisateur connecté.
export async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  return request<T>(path, {
    ...init,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
}

export interface RegisterInput {
  email: string;
  password: string;
  role: "TALENT" | "PRESTATAIRE" | "PARTENAIRE";
  phone?: string;
}

// L'inscription et la connexion (tant que la MFA n'a jamais été finalisée)
// renvoient les informations d'enrôlement TOTP à scanner avec une
// application d'authentification (Google Authenticator, Authy, etc.).
export interface MfaChallenge {
  message: string;
  pendingMfaToken: string;
  needsSetup: boolean;
  otpauthUrl?: string;
  qrCodeDataUrl?: string;
  manualKey?: string;
}

export function registerAccount(input: RegisterInput) {
  return request<MfaChallenge>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(email: string, password: string) {
  return request<MfaChallenge>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function verifyMfa(pendingMfaToken: string, code: string) {
  return request<{ token: string; role: string; status: string }>("/api/auth/verify-mfa", {
    method: "POST",
    body: JSON.stringify({ pendingMfaToken, code }),
  });
}

export interface Me {
  id: string;
  email: string;
  role: "TALENT" | "PRESTATAIRE" | "PARTENAIRE" | "GESTIONNAIRE" | "ADMINISTRATEUR";
  status: "ACTIF" | "SUSPENDU" | "EN_ATTENTE_VALIDATION";
  mfaEnabled: boolean;
  // §7.4 — 30 jours d'essai à l'inscription pour les comptes Talent,
  // Prestataire et Partenaire ; null/true pour les comptes internes
  // (Gestionnaire, Administrateur), qui n'y sont pas soumis.
  accesActif: boolean;
  essaiExpireLe: string | null;
  abonnementActif: boolean;
}

export function getMe() {
  return authRequest<Me>("/api/me");
}
