import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { verifyAuthToken } from "../lib/jwt";

export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; role: Role };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  try {
    const payload = verifyAuthToken(header.slice("Bearer ".length));
    if (!payload.mfaVerified) {
      return res.status(401).json({ error: "Vérification MFA requise" });
    }
    req.auth = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: "Jeton invalide ou expiré" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: "Accès refusé pour ce rôle" });
    }
    next();
  };
}
