import { prisma } from "./prisma";

// Résout l'entreprise Partenaire rattachée à l'utilisateur connecté — un
// compte principal ou un collaborateur (§5.1 des spécifications).
export async function getPartenaireCompanyForUser(userId: string) {
  const member = await prisma.partenaireMember.findUnique({
    where: { userId },
    include: { company: true },
  });
  return member?.company ?? null;
}
