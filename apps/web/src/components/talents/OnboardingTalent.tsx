"use client";

import { useState } from "react";
import { creerProfil } from "@/lib/talents-api";

// §3.1 — Complétion progressive du profil, incitative à la première
// connexion. La vérification d'identité légère (pièce d'identité, selfie
// optionnel) reste à brancher pour obtenir le statut « Talent Vérifié ».
export function OnboardingTalent({ onCreated }: { onCreated: () => void }) {
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [adresse, setAdresse] = useState("");
  const [domaines, setDomaines] = useState("");
  const [competences, setCompetences] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await creerProfil({
        nom,
        prenoms,
        linkedin: linkedin || undefined,
        adresse: adresse || undefined,
        domainesExpertise: domaines
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        competences: competences
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
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
      <h1 className="text-lg font-semibold text-neutre-900">Complétez votre profil</h1>
      <p className="mt-1 text-sm text-neutre-600">
        Nécessaire avant d&apos;accéder aux opportunités et à l&apos;abonnement.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutre-900">Prénoms</label>
            <input
              required
              value={prenoms}
              onChange={(e) => setPrenoms(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutre-900">Nom</label>
            <input
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutre-900">LinkedIn</label>
          <input
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="/in/votre-profil"
            className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutre-900">Adresse</label>
          <input
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            placeholder="Ville, pays"
            className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutre-900">
            Domaines d&apos;expertise
          </label>
          <input
            value={domaines}
            onChange={(e) => setDomaines(e.target.value)}
            placeholder="Développement web, Data & IA…"
            className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-neutre-600">Séparez par des virgules.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutre-900">Compétences</label>
          <input
            value={competences}
            onChange={(e) => setCompetences(e.target.value)}
            placeholder="React, Node.js, PostgreSQL…"
            className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-neutre-600">Séparez par des virgules.</p>
        </div>

        {error && <p className="text-sm text-orange-fonce">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-vert-benovare px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : "Enregistrer mon profil"}
        </button>
      </form>
    </div>
  );
}
