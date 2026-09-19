import { prisma } from "./prisma";
import type { CategorieNotification } from "@prisma/client";

// §2 — Centre de notifications transversal : un point d'entrée unique par
// utilisateur, alimenté depuis les différents événements métier (nouvelle
// candidature, échéance, message, alerte système).
export async function notifyUser(userId: string, categorie: CategorieNotification, titre: string, contenu: string) {
  await prisma.notification.create({ data: { userId, categorie, titre, contenu } });
}

export async function notifyUsers(userIds: string[], categorie: CategorieNotification, titre: string, contenu: string) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, categorie, titre, contenu })),
  });
}

// Notifie tous les collaborateurs rattachés à une entreprise Partenaire.
export async function notifyPartenaireCompany(
  companyId: string,
  categorie: CategorieNotification,
  titre: string,
  contenu: string
) {
  const membres = await prisma.partenaireMember.findMany({
    where: { companyId },
    select: { userId: true },
  });
  await notifyUsers(membres.map((m) => m.userId), categorie, titre, contenu);
}

export async function notifyPrestataireCompany(
  companyId: string,
  categorie: CategorieNotification,
  titre: string,
  contenu: string
) {
  const membres = await prisma.prestataireMember.findMany({
    where: { companyId },
    select: { userId: true },
  });
  await notifyUsers(membres.map((m) => m.userId), categorie, titre, contenu);
}
