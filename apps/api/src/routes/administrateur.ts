import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { createTotpSecret } from "../lib/totp";
import { encryptSecret } from "../lib/crypto";

export const administrateurRouter = Router();

administrateurRouter.use(requireAuth, requireRole("ADMINISTRATEUR"));

const compteInterneSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  role: z.enum(["GESTIONNAIRE", "ADMINISTRATEUR"]),
  nom: z.string().min(1),
});

// §7.1/§7.3 — Seul point de création des comptes internes (Gestionnaire de
// compte, Administrateur). Le mot de passe est défini ici par
// l'Administrateur et communiqué de façon sécurisée à la personne
// concernée (hors plateforme) ; elle finalise elle-même sa configuration
// MFA à sa première connexion (flux de /api/auth/login).
administrateurRouter.post("/utilisateurs/interne", async (req: AuthenticatedRequest, res) => {
  const parsed = compteInterneSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, role, nom } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Un compte existe déjà avec cet e-mail" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const mfaSecret = createTotpSecret();
  const user = await prisma.user.create({
    data: { email, passwordHash, role, mfaSecret: encryptSecret(mfaSecret), status: "ACTIF" },
  });

  if (role === "GESTIONNAIRE") {
    await prisma.gestionnaireProfile.create({ data: { userId: user.id, nom } });
  } else {
    await prisma.adminProfile.create({ data: { userId: user.id, nom } });
  }

  return res.status(201).json({ id: user.id, email: user.email, role: user.role });
});

// §7.2 — Tableau de bord global.
administrateurRouter.get("/dashboard", async (_req: AuthenticatedRequest, res) => {
  const [talents, prestataires, partenaires, missionsEnCours, missionsCloturees, litigesOuverts] =
    await Promise.all([
      prisma.user.count({ where: { role: "TALENT" } }),
      prisma.user.count({ where: { role: "PRESTATAIRE" } }),
      prisma.user.count({ where: { role: "PARTENAIRE" } }),
      prisma.mission.count({ where: { statut: "EN_COURS" } }),
      prisma.mission.count({ where: { statut: { not: "EN_COURS" } } }),
      prisma.mission.count({ where: { statut: "CLOTUREE_LITIGE" } }),
    ]);

  return res.json({
    comptesActifsParType: { talents, prestataires, partenaires },
    missionsEnCours,
    missionsCloturees,
    litigesOuverts,
  });
});

// §7.3 — Gestion des utilisateurs : vue globale, activation/suspension.
administrateurRouter.get("/utilisateurs", async (_req: AuthenticatedRequest, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      talentProfile: { select: { nom: true, prenoms: true } },
      partenaireMember: { select: { company: { select: { raisonSociale: true, gestionnaireCompteId: true } } } },
      prestataireMember: { select: { company: { select: { raisonSociale: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json(users);
});

const statutSchema = z.object({ status: z.enum(["ACTIF", "SUSPENDU"]) });

administrateurRouter.post("/utilisateurs/:id/statut", async (req: AuthenticatedRequest, res) => {
  const parsed = statutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await prisma.user.update({
    where: { id: String(req.params.id) },
    data: { status: parsed.data.status },
  });
  return res.json(user);
});

// Attribution des portefeuilles de comptes Partenaires aux Gestionnaires
// de compte (§7.3).
administrateurRouter.get("/gestionnaires", async (_req: AuthenticatedRequest, res) => {
  const gestionnaires = await prisma.gestionnaireProfile.findMany({
    include: { user: { select: { email: true } } },
  });
  return res.json(gestionnaires);
});

administrateurRouter.get("/partenaires", async (_req: AuthenticatedRequest, res) => {
  const partenaires = await prisma.partenaireCompany.findMany({
    include: { gestionnaireCompte: { include: { user: { select: { email: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json(partenaires);
});

const assignerSchema = z.object({ gestionnaireId: z.string().nullable() });

administrateurRouter.post("/partenaires/:id/assigner", async (req: AuthenticatedRequest, res) => {
  const parsed = assignerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const company = await prisma.partenaireCompany.update({
    where: { id: String(req.params.id) },
    data: { gestionnaireCompteId: parsed.data.gestionnaireId },
  });
  return res.json(company);
});

// §7.6 — Programme de mérite & Profil Unicorn : validation finale. À terme,
// ceci devrait consommer une file de propositions transmises par les
// Gestionnaires de compte (§6.6) ; en l'absence de cette file, l'attribution
// se fait ici directement.
const meriteSchema = z.object({ badgeMerite: z.boolean().optional(), profilUnicorn: z.boolean().optional() });

administrateurRouter.post("/merite/talent/:id", async (req: AuthenticatedRequest, res) => {
  const parsed = meriteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const profile = await prisma.talentProfile.update({
    where: { id: String(req.params.id) },
    data: parsed.data,
  });
  return res.json(profile);
});

administrateurRouter.post("/merite/prestataire/:id", async (req: AuthenticatedRequest, res) => {
  const parsed = meriteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const company = await prisma.prestataireCompany.update({
    where: { id: String(req.params.id) },
    data: parsed.data,
  });
  return res.json(company);
});

administrateurRouter.get("/merite/candidats", async (_req: AuthenticatedRequest, res) => {
  const [talents, prestataires] = await Promise.all([
    prisma.talentProfile.findMany({
      where: { trustScore: { gte: 0 } },
      select: { id: true, nom: true, prenoms: true, trustScore: true, badgeMerite: true, profilUnicorn: true },
      orderBy: { trustScore: "desc" },
    }),
    prisma.prestataireCompany.findMany({
      select: { id: true, raisonSociale: true, trustScore: true, badgeMerite: true, profilUnicorn: true },
      orderBy: { trustScore: "desc" },
    }),
  ]);
  return res.json({ talents, prestataires });
});

// §7.5 — Catalogue et taxonomie : référentiels partagés (domaines
// d'expertise des Talents, catégories techniques des besoins) maintenus par
// l'Administrateur pour harmoniser les classifications plutôt que de
// laisser des champs libres non contrôlés.
const nomSchema = z.object({ nom: z.string().min(1) });

administrateurRouter.get("/catalogue/domaines-expertise", async (_req: AuthenticatedRequest, res) => {
  const domaines = await prisma.domaineExpertise.findMany({
    include: { _count: { select: { talents: true } } },
    orderBy: { nom: "asc" },
  });
  return res.json(domaines);
});

administrateurRouter.post("/catalogue/domaines-expertise", async (req: AuthenticatedRequest, res) => {
  const parsed = nomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const domaine = await prisma.domaineExpertise.create({ data: { nom: parsed.data.nom } }).catch(() => null);
  if (!domaine) {
    return res.status(409).json({ error: "Ce domaine d'expertise existe déjà" });
  }
  return res.status(201).json(domaine);
});

administrateurRouter.delete("/catalogue/domaines-expertise/:id", async (req: AuthenticatedRequest, res) => {
  const domaine = await prisma.domaineExpertise.findUnique({
    where: { id: String(req.params.id) },
    include: { _count: { select: { talents: true } } },
  });
  if (!domaine) {
    return res.status(404).json({ error: "Domaine introuvable" });
  }
  if (domaine._count.talents > 0) {
    return res.status(409).json({ error: "Ce domaine est utilisé par des Talents et ne peut pas être supprimé" });
  }
  await prisma.domaineExpertise.delete({ where: { id: domaine.id } });
  return res.status(204).send();
});

administrateurRouter.get("/catalogue/categories-techniques", async (_req: AuthenticatedRequest, res) => {
  const categories = await prisma.categorieTechnique.findMany({ orderBy: { nom: "asc" } });
  return res.json(categories);
});

administrateurRouter.post("/catalogue/categories-techniques", async (req: AuthenticatedRequest, res) => {
  const parsed = nomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const categorie = await prisma.categorieTechnique.create({ data: { nom: parsed.data.nom } }).catch(() => null);
  if (!categorie) {
    return res.status(409).json({ error: "Cette catégorie technique existe déjà" });
  }
  return res.status(201).json(categorie);
});

administrateurRouter.delete("/catalogue/categories-techniques/:id", async (req: AuthenticatedRequest, res) => {
  await prisma.categorieTechnique.delete({ where: { id: String(req.params.id) } }).catch(() => null);
  return res.status(204).send();
});
