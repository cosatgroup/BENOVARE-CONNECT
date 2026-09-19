import { prisma } from "./prisma";

export async function getPrestataireCompanyForUser(userId: string) {
  const member = await prisma.prestataireMember.findUnique({
    where: { userId },
    include: { company: { include: { subscription: true, membres: true } } },
  });
  return member?.company ?? null;
}

// Palier d'abonnement → niveau d'étoiles maximum accessible aux appels
// d'offres (même logique que pour les Talents, §3.3/§4.3).
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
