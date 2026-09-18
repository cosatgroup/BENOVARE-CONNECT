import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { OtpChannel } from "@prisma/client";

const OTP_TTL_MINUTES = 10;

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Émission d'un OTP. L'envoi effectif (SMS/e-mail) est délégué à un
// fournisseur à brancher plus tard — ici on journalise pour le développement.
export async function issueOtp(userId: string, channel: OtpChannel): Promise<string> {
  const code = generateSixDigitCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { userId, codeHash, channel, expiresAt },
  });

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[OTP:dev] code pour ${userId} via ${channel} : ${code}`);
  }

  return code;
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
