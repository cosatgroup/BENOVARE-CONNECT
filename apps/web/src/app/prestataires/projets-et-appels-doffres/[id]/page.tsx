"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProjet, soumettre, type ProjetBesoin } from "@/lib/prestataires-api";
import { useEntreprisePrestataire } from "@/components/prestataires/useEntreprisePrestataire";

export default function ProjetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { company } = useEntreprisePrestataire();
  const [projet, setProjet] = useState<(ProjetBesoin & { maCandidature: { id: string; statut: string } | null }) | null>(
    null
  );
  const [equipe, setEquipe] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProjet(id)
      .then(setProjet)
      .catch((err) => setError(err instanceof Error ? err.message : "Une erreur est survenue"));
  }, [id]);

  if (error) return <p className="text-sm text-orange-fonce">{error}</p>;
  if (!projet) return null;

  async function handleSoumettre() {
    setLoading(true);
    setError(null);
    try {
      const equipeProposee = equipe
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      await soumettre(id, equipeProposee);
      router.push("/prestataires/projets-et-appels-doffres");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">{projet.titre}</h1>
        <p className="mt-1 text-sm text-neutre-600">
          {projet.partenaireCompany?.raisonSociale ?? projet.entrepriseClienteNom} · budget indicatif{" "}
          {projet.budgetIndicatif ?? "non précisé"}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">Besoin</h2>
        <p className="mt-1 text-sm text-neutre-900">{projet.description}</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Conditions de soumission
        </h2>
        <p className="mt-1 text-sm text-neutre-900">
          Documents administratifs, offre financière, offre technique, méthodologie, preuves de
          compétences, profil fiscal, CV techniques.
        </p>
      </section>

      {error && <p className="text-sm text-orange-fonce">{error}</p>}

      {projet.maCandidature ? (
        <p className="text-sm font-medium text-neutre-900">
          Vous avez déjà soumissionné — statut : {projet.maCandidature.statut}.
        </p>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutre-900">Équipe proposée</label>
            <input
              value={equipe}
              onChange={(e) => setEquipe(e.target.value)}
              placeholder="Nom des consultants, séparés par des virgules"
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-neutre-600">
              {company ? `Collaborateurs disponibles : ${company.membres.map((m) => m.nom).join(", ")}` : ""}
            </p>
          </div>
          <button
            onClick={handleSoumettre}
            disabled={loading}
            className="rounded-md bg-vert-benovare px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Envoi…" : "Soumettre la candidature"}
          </button>
        </div>
      )}
    </div>
  );
}
