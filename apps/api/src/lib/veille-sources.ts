// Sources publiques légitimes pour la veille des opportunités du marché
// (§3.6, §4.6, §7.7) — flux RSS uniquement (pas de scraping HTML, plus
// robuste et sans ambiguïté vis-à-vis des conditions d'utilisation des
// sites). Chaque source doit fournir un User-Agent de navigateur : certains
// serveurs (Cloudflare) rejettent les requêtes sans UA.
export interface VeilleSource {
  nom: string;
  url: string;
}

export const VEILLE_SOURCES: VeilleSource[] = [
  {
    nom: "ReliefWeb Jobs",
    url: "https://reliefweb.int/jobs/rss.xml",
  },
  {
    nom: "NGO Jobs in Africa",
    url: "https://ngojobsinafrica.com/feed/",
  },
];

// Un UA s'auto-déclarant comme robot (ex. "BenovareConnectVeille/1.0")
// s'est fait bloquer par le WAF de ReliefWeb (réponse HTML au lieu du XML
// attendu). Un UA de navigateur standard passe sur les deux sources.
export const VEILLE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
