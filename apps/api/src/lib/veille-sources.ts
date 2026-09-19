// Sources publiques légitimes pour la veille des opportunités du marché
// (§3.6, §4.6, §7.7) — flux RSS uniquement (pas de scraping HTML, plus
// robuste et sans ambiguïté vis-à-vis des conditions d'utilisation des
// sites).
export interface VeilleSource {
  nom: string;
  url: string;
}

// ReliefWeb Jobs (https://reliefweb.int/jobs/rss.xml) bloque volontairement
// les accès automatisés (HTTP 406 « Blocked due to bot activity », HDX/ONU)
// — retiré plutôt que contourné. À reconsidérer seulement via une exception
// officielle demandée à hdx@un.org.
export const VEILLE_SOURCES: VeilleSource[] = [
  {
    nom: "NGO Jobs in Africa",
    url: "https://ngojobsinafrica.com/feed/",
  },
];

// ngojobsinafrica.com (Cloudflare) rejette les requêtes sans User-Agent de
// navigateur (HTTP 406 avec un UA vide ou générique).
export const VEILLE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
