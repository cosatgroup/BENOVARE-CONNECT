import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

const ISSUER = "Benovare Connect";

export function createTotpSecret(): string {
  return generateSecret();
}

export async function buildTotpEnrollment(email: string, secret: string) {
  const otpauthUrl = generateURI({ issuer: ISSUER, label: email, secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { otpauthUrl, qrCodeDataUrl, manualKey: secret };
}

export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  const result = await verify({ secret, token: code });
  return result.valid;
}
