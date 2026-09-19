import { prisma } from "./prisma";

export async function getTalentProfileForUser(userId: string) {
  return prisma.talentProfile.findUnique({
    where: { userId },
    include: { subscription: true, competences: true, domainesExpertise: true },
  });
}

// Palier d'abonnement → niveau d'étoiles maximum accessible (§3.3, §3.5).
export function maxEtoilesForPalier(palier: string | null | undefined): number {
  switch (palier) {
    case "SILVER":
      return 2;
    case "GOLD":
      return 3;
    case "PLATINUM":
      return 4;
    default:
      return 0;
  }
}
