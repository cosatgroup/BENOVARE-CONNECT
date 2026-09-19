import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { sendLicenceEmail } from "./email";
import type { Devis, MoyenPaiement } from "@prisma/client";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus (0/O, 1/I/l)

function segment(length: number): string {
  return Array.from({ length }, () => ALPHABET[randomBytes(1)[0] % ALPHABET.length]).join("");
}

function genererCode(): string {
  return `BNVR-${segment(4)}-${segment(4)}`;
}

// Point d'entrée unique appelé après confirmation d'un paiement — quel que
// soit le moyen (webhook KKiaPay/FedaPay ou validation manuelle de
// virement) — pour garantir que le code n'est jamais généré deux fois pour
// le même devis (idempotence) et que l'e-mail part systématiquement.
export async function confirmerPaiementEtEnvoyerCode(
  devisId: string,
  moyenPaiement: MoyenPaiement,
  referenceExterne?: string
): Promise<Devis> {
  const devis = await prisma.devis.findUniqueOrThrow({
    where: { id: devisId },
    include: {
      talentProfile: { include: { user: true } },
      prestataireCompany: { include: { membres: { include: { user: true } } } },
      partenaireCompany: { include: { membres: { include: { user: true } } } },
    },
  });

  if (devis.statut === "PAYE") {
    return devis; // déjà traité — évite un double envoi si le webhook rejoue l'événement.
  }

  const code = genererCode();
  const updated = await prisma.devis.update({
    where: { id: devis.id },
    data: {
      statut: "PAYE",
      moyenPaiement,
      referenceExterne,
      payeLe: new Date(),
      codeLicence: code,
      codeEnvoyeLe: new Date(),
    },
  });

  const destinataire =
    devis.talentProfile?.user.email ??
    devis.prestataireCompany?.membres[0]?.user.email ??
    devis.partenaireCompany?.membres[0]?.user.email;

  if (destinataire) {
    await sendLicenceEmail(destinataire, code, devis.formule, devis.montant, devis.devise);
  }

  return updated;
}
