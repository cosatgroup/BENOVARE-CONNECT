import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET manquant dans l'environnement");
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

export interface AuthTokenPayload {
  userId: string;
  role: Role;
  mfaVerified: boolean;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}

// Jeton de courte durée émis après vérification du mot de passe, en attente
// de la saisie du code MFA (OTP SMS / e-mail / application d'authentification).
export function signPendingMfaToken(userId: string): string {
  return jwt.sign({ userId, stage: "pending_mfa" }, JWT_SECRET, { expiresIn: "10m" });
}

export function verifyPendingMfaToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; stage: string };
  if (decoded.stage !== "pending_mfa") {
    throw new Error("Jeton invalide pour cette étape");
  }
  return { userId: decoded.userId };
}
