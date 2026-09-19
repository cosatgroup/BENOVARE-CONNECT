"use client";

import { useState } from "react";
import { creerEntreprise } from "@/lib/prestataires-api";

// §4.1 — Inscription avec vérification KYB sur présentation des pièces de
// l'entreprise (non implémenté ici) ; le compte créateur devient le
// représentant légal.
export function OnboardingEntreprisePrestataire({ onCreated }: { onCreated: () => void }) {
  const [raisonSociale, setRaisonSociale] = useState("");
  const [secteurActivite, setSecteurActivite] = useState("");
  const [effectif, setEffectif] = useState("");
  const [anneeCreation, setAnneeCreation] = useState("");
  const [coordonnees, setCoordonnees] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await creerEntreprise({
        raisonSociale,
        secteurActivite: secteurActivite || undefined,
        effectif: effectif ? Number(effectif) : undefined,
        anneeCreation: anneeCreation ? Number(anneeCreation) : undefined,
        coordonnees: coordonnees || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md rounded-xl border border-neutre-200 bg-surface p-6">
      <h1 className="text-lg font-semibold text-neutre-900">Renseignez votre entreprise</h1>
      <p className="mt-1 text-sm text-neutre-600">
        Nécessaire avant de soumissionner aux appels d&apos;offres.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutre-900">Raison sociale</label>
          <input
            required
            value={raisonSociale}
            onChange={(e) => setRaisonSociale(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutre-900">Secteur d&apos;activité</label>
          <input
            value={secteurActivite}
            onChange={(e) => setSecteurActivite(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutre-900">Effectif</label>
            <input
              type="number"
              value={effectif}
              onChange={(e) => setEffectif(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutre-900">Année de création</label>
            <input
              type="number"
              value={anneeCreation}
              onChange={(e) => setAnneeCreation(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutre-900">Coordonnées</label>
          <input
            value={coordonnees}
            onChange={(e) => setCoordonnees(e.target.value)}
            placeholder="Ville, pays"
            className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-orange-fonce">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-vert-benovare px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer mon entreprise"}
        </button>
      </form>
    </div>
  );
}
