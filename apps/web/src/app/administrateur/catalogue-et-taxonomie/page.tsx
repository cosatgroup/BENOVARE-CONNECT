"use client";

import { useEffect, useState } from "react";
import {
  creerCategorieTechnique,
  creerDomaineExpertise,
  listerCategoriesTechniques,
  listerDomainesExpertise,
  supprimerCategorieTechnique,
  supprimerDomaineExpertise,
  type CategorieTechniqueAdmin,
  type DomaineExpertiseAdmin,
} from "@/lib/administrateur-api";

export default function CatalogueEtTaxonomiePage() {
  const [domaines, setDomaines] = useState<DomaineExpertiseAdmin[] | null>(null);
  const [categories, setCategories] = useState<CategorieTechniqueAdmin[] | null>(null);
  const [nouveauDomaine, setNouveauDomaine] = useState("");
  const [nouvelleCategorie, setNouvelleCategorie] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    listerDomainesExpertise().then(setDomaines);
    listerCategoriesTechniques().then(setCategories);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function ajouterDomaine(e: React.FormEvent) {
    e.preventDefault();
    if (!nouveauDomaine.trim()) return;
    setError(null);
    try {
      await creerDomaineExpertise(nouveauDomaine.trim());
      setNouveauDomaine("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout");
    }
  }

  async function retirerDomaine(id: string) {
    setError(null);
    try {
      await supprimerDomaineExpertise(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression");
    }
  }

  async function ajouterCategorie(e: React.FormEvent) {
    e.preventDefault();
    if (!nouvelleCategorie.trim()) return;
    setError(null);
    try {
      await creerCategorieTechnique(nouvelleCategorie.trim());
      setNouvelleCategorie("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout");
    }
  }

  async function retirerCategorie(id: string) {
    setError(null);
    try {
      await supprimerCategorieTechnique(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression");
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">Catalogue et taxonomie</h1>
        <p className="mt-1 text-sm text-neutre-600">
          Référentiels partagés utilisés dans les formulaires de la plateforme, pour harmoniser les
          classifications plutôt que de laisser des champs libres.
        </p>
      </div>

      {error && <p className="text-sm text-orange-fonce">{error}</p>}

      <section className="rounded-xl border border-neutre-200 bg-surface p-5">
        <h2 className="font-semibold text-neutre-900">Domaines d&apos;expertise (Talents)</h2>
        <form onSubmit={ajouterDomaine} className="mt-3 flex gap-2">
          <input
            value={nouveauDomaine}
            onChange={(e) => setNouveauDomaine(e.target.value)}
            placeholder="Nouveau domaine"
            className="flex-1 rounded-md border border-neutre-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!nouveauDomaine.trim()}
            className="rounded-md bg-vert-benovare px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            Ajouter
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {domaines?.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-md border border-neutre-200 px-3 py-2 text-sm">
              <span className="text-neutre-900">
                {d.nom} <span className="text-xs text-neutre-600">({d._count.talents} Talent(s))</span>
              </span>
              <button
                onClick={() => retirerDomaine(d.id)}
                disabled={d._count.talents > 0}
                title={d._count.talents > 0 ? "Utilisé par des Talents, suppression impossible" : undefined}
                className="text-xs font-medium text-orange-fonce hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                Supprimer
              </button>
            </li>
          ))}
          {domaines?.length === 0 && <p className="text-sm text-neutre-600">Aucun domaine.</p>}
        </ul>
      </section>

      <section className="rounded-xl border border-neutre-200 bg-surface p-5">
        <h2 className="font-semibold text-neutre-900">Catégories techniques (Besoins)</h2>
        <form onSubmit={ajouterCategorie} className="mt-3 flex gap-2">
          <input
            value={nouvelleCategorie}
            onChange={(e) => setNouvelleCategorie(e.target.value)}
            placeholder="Nouvelle catégorie"
            className="flex-1 rounded-md border border-neutre-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!nouvelleCategorie.trim()}
            className="rounded-md bg-vert-benovare px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            Ajouter
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {categories?.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-md border border-neutre-200 px-3 py-2 text-sm">
              <span className="text-neutre-900">{c.nom}</span>
              <button onClick={() => retirerCategorie(c.id)} className="text-xs font-medium text-orange-fonce hover:underline">
                Supprimer
              </button>
            </li>
          ))}
          {categories?.length === 0 && <p className="text-sm text-neutre-600">Aucune catégorie.</p>}
        </ul>
      </section>
    </div>
  );
}
