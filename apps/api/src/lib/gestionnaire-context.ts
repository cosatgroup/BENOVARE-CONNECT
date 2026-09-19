import { prisma } from "./prisma";

export async function getGestionnaireProfileForUser(userId: string) {
  return prisma.gestionnaireProfile.findUnique({ where: { userId } });
}
