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

// Tolérance d'une fenêtre (±30s) pour absorber la latence réseau et un
// léger décalage d'horloge entre le serveur et l'appareil de l'utilisateur
// — otplib n'a aucune tolérance par défaut (epochTolerance: 0), ce qui est
// trop strict en usage réel.
export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  const result = await verify({ secret, token: code, epochTolerance: 1 });
  return result.valid;
}
