import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { issueOtp, verifyOtp } from "../lib/otp";
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
  const user = await prisma.user.create({
    data: { email, phone, passwordHash, role },
  });

  await issueOtp(user.id, "EMAIL");

  return res.status(201).json({
    message: "Compte créé. Un code de vérification a été envoyé.",
    pendingMfaToken: signPendingMfaToken(user.id),
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

  await issueOtp(user.id, "EMAIL");

  return res.json({
    message: "Code de vérification envoyé.",
    pendingMfaToken: signPendingMfaToken(user.id),
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

  const ok = await verifyOtp(userId, parsed.data.code);
  if (!ok) {
    return res.status(401).json({ error: "Code invalide ou expiré" });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true },
  });

  await prisma.loginEvent.create({
    data: { userId, ip: req.ip, userAgent: req.headers["user-agent"] },
  });

  const token = signAuthToken({ userId: user.id, role: user.role, mfaVerified: true });
  return res.json({ token, role: user.role, status: user.status });
});
