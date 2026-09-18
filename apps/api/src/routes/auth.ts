import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createTotpSecret, buildTotpEnrollment, verifyTotpCode } from "../lib/totp";
import { signAuthToken, signPendingMfaToken, verifyPendingMfaToken } from "../lib/jwt";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  role: z.enum(["TALENT", "PRESTATAIRE", "PARTENAIRE"]), // rôles internes créés par l'Administrateur
  phone: z.string().optional(),
});

// Inscription — la vérification d'identité (Talent) ou KYB (Prestataire/
// Partenaire) reste un statut EN_ATTENTE_VALIDATION jusqu'à validation par
// le Gestionnaire de compte / Administrateur (§6.6, §7.3 des specs).
//
// MFA par application d'authentification (TOTP, RFC 6238) : un secret est
// généré à la création du compte et présenté sous forme de QR code à
// scanner. Le compte n'est activé (mfaEnabled) qu'après la première
// vérification réussie d'un code généré par l'application.
authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, role, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Un compte existe déjà avec cet e-mail" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  // TODO: chiffrer mfaSecret au repos avant un vrai lancement en production.
  const mfaSecret = createTotpSecret();
  const user = await prisma.user.create({
    data: { email, phone, passwordHash, role, mfaSecret },
  });

  const enrollment = await buildTotpEnrollment(email, mfaSecret);

  return res.status(201).json({
    message: "Compte créé. Scannez le QR code avec votre application d'authentification.",
    pendingMfaToken: signPendingMfaToken(user.id),
    needsSetup: true,
    ...enrollment,
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Identifiants invalides" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Identifiants invalides" });
  }

  if (user.status === "SUSPENDU") {
    return res.status(403).json({ error: "Compte suspendu" });
  }

  const pendingMfaToken = signPendingMfaToken(user.id);

  // Compte créé mais configuration MFA jamais finalisée (première
  // vérification jamais réussie) : on repropose l'enrôlement.
  if (!user.mfaEnabled) {
    if (!user.mfaSecret) {
      return res.status(500).json({ error: "Configuration MFA manquante, contactez le support" });
    }
    const enrollment = await buildTotpEnrollment(user.email, user.mfaSecret);
    return res.json({
      message: "Finalisez la configuration de votre application d'authentification.",
      pendingMfaToken,
      needsSetup: true,
      ...enrollment,
    });
  }

  return res.json({
    message: "Saisissez le code affiché par votre application d'authentification.",
    pendingMfaToken,
    needsSetup: false,
  });
});

const verifyMfaSchema = z.object({
  pendingMfaToken: z.string(),
  code: z.string().length(6),
});

authRouter.post("/verify-mfa", async (req, res) => {
  const parsed = verifyMfaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  let userId: string;
  try {
    ({ userId } = verifyPendingMfaToken(parsed.data.pendingMfaToken));
  } catch {
    return res.status(401).json({ error: "Session de vérification expirée, reconnectez-vous" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.mfaSecret) {
    return res.status(401).json({ error: "Configuration MFA introuvable" });
  }

  const ok = await verifyTotpCode(user.mfaSecret, parsed.data.code);
  if (!ok) {
    return res.status(401).json({ error: "Code invalide ou expiré" });
  }

  const updated = user.mfaEnabled
    ? user
    : await prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });

  await prisma.loginEvent.create({
    data: { userId, ip: req.ip, userAgent: req.headers["user-agent"] },
  });

  const token = signAuthToken({ userId: updated.id, role: updated.role, mfaVerified: true });
  return res.json({ token, role: updated.role, status: updated.status });
});
