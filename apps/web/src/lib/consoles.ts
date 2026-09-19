// Arborescence des menus par console, telle que définie dans les
// spécifications fonctionnelles (§3 à §7). Chaque entrée devient un lien de
// navigation ; `href` reste `undefined` tant que l'écran n'est pas construit
// (affiché mais désactivé) — voir DashboardShell.

export type Role =
  | "TALENT"
  | "PRESTATAIRE"
  | "PARTENAIRE"
  | "GESTIONNAIRE"
  | "ADMINISTRATEUR";

export interface NavItem {
  label: string;
  href?: string;
}

export interface ConsoleConfig {
  role: Role;
  nomConsole: string;
  basePath: string;
  nav: NavItem[];
}

export const consoles: Record<Role, ConsoleConfig> = {
  TALENT: {
    role: "TALENT",
    nomConsole: "Console Talents",
    basePath: "/talents",
    nav: [
      { label: "Tableau de bord", href: "/talents" },
      { label: "Profil", href: "/talents/profil" },
      { label: "Opportunités", href: "/talents/opportunites" },
      { label: "Carrières", href: "/talents/carrieres" },
      { label: "Abonnement", href: "/talents/abonnement" },
      { label: "Benovare" },
    ],
  },
  PRESTATAIRE: {
    role: "PRESTATAIRE",
    nomConsole: "Console Prestataires",
    basePath: "/prestataires",
    nav: [
      { label: "Tableau de bord", href: "/prestataires" },
      { label: "Profil entreprise", href: "/prestataires/profil-entreprise" },
      { label: "Projets & appels d'offres", href: "/prestataires/projets-et-appels-doffres" },
      { label: "Missions", href: "/prestataires/missions" },
      { label: "Abonnement", href: "/prestataires/abonnement" },
      { label: "Carrières", href: "/prestataires/carrieres" },
      { label: "Benovare" },
    ],
  },
  PARTENAIRE: {
    role: "PARTENAIRE",
    nomConsole: "Console Partenaires",
    basePath: "/partenaires",
    nav: [
      { label: "Tableau de bord", href: "/partenaires" },
      { label: "Publier un besoin", href: "/partenaires/publier-un-besoin" },
      { label: "Candidatures", href: "/partenaires/candidatures" },
      { label: "Missions", href: "/partenaires/missions" },
      { label: "Abonnement", href: "/partenaires/abonnement" },
      { label: "Benovare" },
    ],
  },
  GESTIONNAIRE: {
    role: "GESTIONNAIRE",
    nomConsole: "Console Gestionnaire de compte",
    basePath: "/gestionnaire",
    nav: [
      { label: "Tableau de bord", href: "/gestionnaire" },
      { label: "Sourcing et sélection", href: "/gestionnaire/sourcing-et-selection" },
      { label: "Pilotage des missions", href: "/gestionnaire/pilotage-des-missions" },
      { label: "Gestion des comptes", href: "/gestionnaire/gestion-des-comptes" },
      { label: "Reporting", href: "/gestionnaire/reporting" },
    ],
  },
  ADMINISTRATEUR: {
    role: "ADMINISTRATEUR",
    nomConsole: "Console Administrateur",
    basePath: "/administrateur",
    nav: [
      { label: "Tableau de bord global", href: "/administrateur" },
      { label: "Gestion des utilisateurs", href: "/administrateur/gestion-des-utilisateurs" },
      { label: "Abonnements et tarification", href: "/administrateur/abonnements-et-tarification" },
      { label: "Mérite et Profil Unicorn", href: "/administrateur/merite-et-profil-unicorn" },
      { label: "Catalogue et taxonomie", href: "/administrateur/catalogue-et-taxonomie" },
      { label: "Carrières et veille du marché", href: "/administrateur/carrieres-et-veille-du-marche" },
      { label: "Modération et conformité" },
      { label: "Statistiques stratégiques" },
      { label: "Support" },
    ],
  },
};
