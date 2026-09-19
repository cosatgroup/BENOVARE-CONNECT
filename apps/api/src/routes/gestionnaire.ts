import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { getGestionnaireProfileForUser } from "../lib/gestionnaire-context";
import { notifyPartenaireCompany, notifyPrestataireCompany, notifyUser } from "../lib/notifications";

export const gestionnaireRouter = Router();

gestionnaireRouter.use(requireAuth, requireRole("GESTIONNAIRE"));

// NOTE : portefeuille non filtré (vision plateforme entière) tant que
// l'Administrateur — qui assigne les comptes aux Gestionnaires (§7.3) —
// n'existe pas. À restreindre à `GestionnaireProfile.portefeuillePartenaires`
// une fois cette brique construite.

gestionnaireRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const profile = await getGestionnaireProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Profil gestionnaire introuvable" });
  }
  return res.json(profile);
});

// §6.2 — Tableau de bord : vue consolidée du portefeuille.
gestionnaireRouter.get("/dashboard", async (_req: AuthenticatedRequest, res) => {
  const [candidaturesEnAttente, missionsActives, comptesAValider] = await Promise.all([
    prisma.candidature.count({ where: { statut: { in: ["SOUMISE", "PRESELECTIONNEE"] } } }),
    prisma.mission.count({ where: { statut: "EN_COURS" } }),
    Promise.all([
      prisma.partenaireCompany.count({ where: { verifieKYB: false } }),
      prisma.prestataireCompany.count({ where: { verifieKYB: false } }),
      prisma.talentProfile.count({ where: { verifie: false } }),
    ]).then(([a, b, c]) => a + b + c),
  ]);

  return res.json({ candidaturesEnAttente, missionsActives, comptesAValider });
});

// §6.3 — Pipeline des candidatures en attente du premier entretien Benovare.
gestionnaireRouter.get("/candidatures", async (_req: AuthenticatedRequest, res) => {
  const candidatures = await prisma.candidature.findMany({
    where: { statut: { in: ["SOUMISE", "PRESELECTIONNEE", "ENTRETIEN_PLANIFIE", "ENTRETIEN_FINAL"] } },
    include: {
      besoin: { include: { partenaireCompany: true } },
      talent: true,
      prestataireCompany: true,
      entretiens: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return res.json(candidatures);
});

const entretienSchema = z.object({
  resultat: z.enum(["FAVORABLE", "DEFAVORABLE"]),
  compteRendu: z.string().min(1),
});

// Premier entretien (technique et administratif), mené par le Gestionnaire
// de compte. Un résultat favorable transmet la candidature au Partenaire
// pour l'entretien final et la décision (§2, §6.3).
gestionnaireRouter.post("/candidatures/:id/entretien", async (req: AuthenticatedRequest, res) => {
  const parsed = entretienSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const profile = await getGestionnaireProfileForUser(req.auth!.userId);
  if (!profile) {
    return res.status(404).json({ error: "Profil gestionnaire introuvable" });
  }

  const candidature = await prisma.candidature.findUnique({
    where: { id: String(req.params.id) },
    include: {
      entretiens: true,
      besoin: true,
      talent: true,
      prestataireCompany: true,
    },
  });
  if (!candidature) {
    return res.status(404).json({ error: "Candidature introuvable" });
  }

  const existing = candidature.entretiens.find((e) => e.type === "PREMIER_ENTRETIEN_BENOVARE");
  const entretien = existing
    ? await prisma.entretien.update({
        where: { id: existing.id },
        data: { resultat: parsed.data.resultat, compteRendu: parsed.data.compteRendu, gestionnaireId: profile.id },
      })
    : await prisma.entretien.create({
        data: {
          candidatureId: candidature.id,
          type: "PREMIER_ENTRETIEN_BENOVARE",
          resultat: parsed.data.resultat,
          compteRendu: parsed.data.compteRendu,
          gestionnaireId: profile.id,
        },
      });

  const nouveauStatut = parsed.data.resultat === "FAVORABLE" ? "ENTRETIEN_FINAL" : "REFUSEE";
  await prisma.candidature.update({ where: { id: candidature.id }, data: { statut: nouveauStatut } });

  const candidatNom = candidature.talent
    ? `${candidature.talent.prenoms} ${candidature.talent.nom}`
    : (candidature.prestataireCompany?.raisonSociale ?? "Le candidat");

  if (parsed.data.resultat === "FAVORABLE" && candidature.besoin.partenaireCompanyId) {
    await notifyPartenaireCompany(
      candidature.besoin.partenaireCompanyId,
      "OPPORTUNITE",
      "Entretien final à mener",
      `${candidatNom} a passé avec succès le premier entretien pour « ${candidature.besoin.titre} ». À vous de conduire l'entretien final.`
    );
  } else if (parsed.data.resultat === "DEFAVORABLE") {
    const message = `Votre candidature à « ${candidature.besoin.titre} » n'a pas été retenue à l'issue du premier entretien.`;
    if (candidature.talent) {
      await notifyUser(candidature.talent.userId, "OPPORTUNITE", "Candidature non retenue", message);
    } else if (candidature.prestataireCompanyId) {
      await notifyPrestataireCompany(candidature.prestataireCompanyId, "OPPORTUNITE", "Candidature non retenue", message);
    }
  }

  return res.status(201).json(entretien);
});

// §6.4 — Pilotage des missions (vision portefeuille).
gestionnaireRouter.get("/missions", async (_req: AuthenticatedRequest, res) => {
  const missions = await prisma.mission.findMany({
    include: { besoin: { include: { partenaireCompany: true } }, jalons: true, demandes: true, livrables: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json(missions);
});

gestionnaireRouter.get("/missions/:id", async (req: AuthenticatedRequest, res) => {
  const mission = await prisma.mission.findUnique({
    where: { id: String(req.params.id) },
    include: {
      besoin: { include: { partenaireCompany: true } },
      jalons: { orderBy: { ordre: "asc" } },
      livrables: { orderBy: { deposeLe: "desc" } },
      demandes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!mission) {
    return res.status(404).json({ error: "Mission introuvable" });
  }
  return res.json(mission);
});

const recommandationSchema = z.object({
  complexite: z.string().optional(),
  recommandation: z.string().min(1),
});

// Instruction d'une demande de délai/avenant : vérification du caractère
// anticipé, analyse de complexité, recommandation transmise au Partenaire
// qui reste seul décisionnaire (§2, §6.4).
gestionnaireRouter.post(
  "/missions/:id/demandes/:demandeId/recommandation",
  async (req: AuthenticatedRequest, res) => {
    const parsed = recommandationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const demande = await prisma.demandeAvenant.findFirst({
      where: { id: String(req.params.demandeId), missionId: String(req.params.id) },
    });
    if (!demande) {
      return res.status(404).json({ error: "Demande introuvable" });
    }

    const updated = await prisma.demandeAvenant.update({
      where: { id: demande.id },
      data: { complexite: parsed.data.complexite, recommandationGestionnaire: parsed.data.recommandation },
    });

    return res.json(updated);
  }
);

// Validation des livrables déposés (§6.4).
gestionnaireRouter.post("/missions/:id/livrables/:livrableId/valider", async (req: AuthenticatedRequest, res) => {
  const livrable = await prisma.livrable.findFirst({
    where: { id: String(req.params.livrableId), missionId: String(req.params.id) },
  });
  if (!livrable) {
    return res.status(404).json({ error: "Livrable introuvable" });
  }

  const updated = await prisma.livrable.update({ where: { id: livrable.id }, data: { valide: true } });
  return res.json(updated);
});

// §6.6 — Gestion des comptes : validation KYC/KYB.
gestionnaireRouter.get("/comptes", async (_req: AuthenticatedRequest, res) => {
  const [partenaires, prestataires, talents] = await Promise.all([
    prisma.partenaireCompany.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.prestataireCompany.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.talentProfile.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return res.json({ partenaires, prestataires, talents });
});

gestionnaireRouter.post("/comptes/partenaire/:id/valider", async (req: AuthenticatedRequest, res) => {
  const company = await prisma.partenaireCompany.update({
    where: { id: String(req.params.id) },
    data: { verifieKYB: true },
  });
  return res.json(company);
});

gestionnaireRouter.post("/comptes/prestataire/:id/valider", async (req: AuthenticatedRequest, res) => {
  const company = await prisma.prestataireCompany.update({
    where: { id: String(req.params.id) },
    data: { verifieKYB: true },
  });
  return res.json(company);
});

gestionnaireRouter.post("/comptes/talent/:id/valider", async (req: AuthenticatedRequest, res) => {
  const profile = await prisma.talentProfile.update({
    where: { id: String(req.params.id) },
    data: { verifie: true },
  });
  return res.json(profile);
});
