import Parser from "rss-parser";
import { prisma } from "./prisma";
import { VEILLE_SOURCES, VEILLE_USER_AGENT } from "./veille-sources";

const parser = new Parser({ headers: { "User-Agent": VEILLE_USER_AGENT } });

function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface CollecteResult {
  source: string;
  trouvees: number;
  nouvelles: number;
  erreur?: string;
}

// Collecte les flux RSS configurés et enregistre les nouvelles annonces en
// statut EN_ATTENTE — l'Administrateur les modère avant publication
// (§7.7 : « modération des annonces avant leur publication »).
export async function collecterOpportunitesExternes(): Promise<CollecteResult[]> {
  const resultats: CollecteResult[] = [];

  for (const source of VEILLE_SOURCES) {
    try {
      const response = await fetch(source.url, { headers: { "User-Agent": VEILLE_USER_AGENT } });
      const body = await response.text();
      if (!response.ok || !body.trim().startsWith("<")) {
        throw new Error(
          `Réponse inattendue (HTTP ${response.status}, content-type ${response.headers.get("content-type")}) : ${body.slice(0, 200)}`
        );
      }
      const feed = await parser.parseString(body);
      let nouvelles = 0;

      for (const item of feed.items) {
        if (!item.link || !item.title) continue;

        const existing = await prisma.opportuniteExterne.findUnique({ where: { url: item.link } });
        if (existing) continue;

        await prisma.opportuniteExterne.create({
          data: {
            titre: item.title,
            description: stripHtml(item.contentSnippet ?? item.content ?? item.summary).slice(0, 2000),
            url: item.link,
            source: source.nom,
            publieLe: item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : null,
          },
        });
        nouvelles += 1;
      }

      resultats.push({ source: source.nom, trouvees: feed.items.length, nouvelles });
    } catch (err) {
      resultats.push({
        source: source.nom,
        trouvees: 0,
        nouvelles: 0,
        erreur: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
  }

  return resultats;
}
