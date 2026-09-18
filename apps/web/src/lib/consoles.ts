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
      { label: "Profil" },
      { label: "Opportunités" },
      { label: "Carrières" },
      { label: "Abonnement" },
      { label: "Benovare" },
    ],
  },
  PRESTATAIRE: {
    role: "PRESTATAIRE",
    nomConsole: "Console Prestataires",
    basePath: "/prestataires",
    nav: [
      { label: "Tableau de bord", href: "/prestataires" },
      { label: "Profil entreprise" },
      { label: "Projets & appels d'offres" },
      { label: "Missions" },
      { label: "Abonnement" },
      { label: "Carrières" },
      { label: "Benovare" },
    ],
  },
  PARTENAIRE: {
    role: "PARTENAIRE",
    nomConsole: "Console Partenaires",
    basePath: "/partenaires",
    nav: [
      { label: "Tableau de bord", href: "/partenaires" },
      { label: "Publier un besoin" },
      { label: "Candidatures" },
      { label: "Missions" },
      { label: "Conseil & audit" },
      { label: "Abonnement" },
      { label: "Benovare" },
    ],
  },
  GESTIONNAIRE: {
    role: "GESTIONNAIRE",
    nomConsole: "Console Gestionnaire de compte",
    basePath: "/gestionnaire",
    nav: [
      { label: "Tableau de bord", href: "/gestionnaire" },
      { label: "Sourcing et sélection" },
      { label: "Pilotage des missions" },
      { label: "Gestion des comptes" },
      { label: "Reporting" },
    ],
  },
  ADMINISTRATEUR: {
    role: "ADMINISTRATEUR",
    nomConsole: "Console Administrateur",
    basePath: "/administrateur",
    nav: [
      { label: "Tableau de bord global", href: "/administrateur" },
      { label: "Gestion des utilisateurs" },
      { label: "Abonnements et tarification" },
      { label: "Mérite et Profil Unicorn" },
      { label: "Catalogue et taxonomie" },
      { label: "Carrières et veille du marché" },
      { label: "Modération et conformité" },
      { label: "Statistiques stratégiques" },
      { label: "Support" },
    ],
  },
};
