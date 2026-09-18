import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sendOtpEmail } from "./email";
import type { OtpChannel } from "@prisma/client";

const OTP_TTL_MINUTES = 10;

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Émission d'un OTP. Seul le canal EMAIL est branché à un fournisseur réel
// (Resend) pour l'instant — SMS et application d'authentification restent à
// implémenter (§2 des spécifications).
export async function issueOtp(userId: string, email: string, channel: OtpChannel): Promise<void> {
  const code = generateSixDigitCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { userId, codeHash, channel, expiresAt },
  });

  if (channel === "EMAIL") {
    await sendOtpEmail(email, code);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[OTP:non-implémenté] canal ${channel} — code pour ${userId} : ${code}`);
  }
}

export async function verifyOtp(userId: string, code: string): Promise<boolean> {
  const candidate = await prisma.otpCode.findFirst({
    where: { userId, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!candidate) return false;

  const valid = await bcrypt.compare(code, candidate.codeHash);
  if (!valid) return false;

  await prisma.otpCode.update({
    where: { id: candidate.id },
    data: { consumedAt: new Date() },
  });
  return true;
}
