"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { candidater, getOpportunite, type OpportuniteBesoin } from "@/lib/talents-api";

export default function OpportuniteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [opportunite, setOpportunite] = useState<
    (OpportuniteBesoin & { maCandidature: { id: string; statut: string } | null }) | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getOpportunite(id)
      .then(setOpportunite)
      .catch((err) => setError(err instanceof Error ? err.message : "Une erreur est survenue"));
  }, [id]);

  if (error) return <p className="text-sm text-orange-fonce">{error}</p>;
  if (!opportunite) return null;

  async function handlePostuler() {
    setLoading(true);
    setError(null);
    try {
      await candidater(id);
      router.push("/talents/opportunites");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">{opportunite.titre}</h1>
        <p className="mt-1 text-sm text-neutre-600">
          {opportunite.partenaireCompany?.raisonSociale ?? "Prestataire"} · {opportunite.niveauEtoiles} étoile
          {opportunite.niveauEtoiles > 1 ? "s" : ""}
          {opportunite.categorieTechnique ? ` · ${opportunite.categorieTechnique}` : ""}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">Besoin</h2>
        <p className="mt-1 text-sm text-neutre-900">{opportunite.description}</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Conditions de candidature
        </h2>
        <p className="mt-1 text-sm text-neutre-900">
          CV technique, preuves de compétences, entretien de sélection.
        </p>
      </section>

      {error && <p className="text-sm text-orange-fonce">{error}</p>}

      {opportunite.maCandidature ? (
        <p className="text-sm font-medium text-neutre-900">
          Vous avez déjà candidaté à cet avis — statut : {opportunite.maCandidature.statut}.
        </p>
      ) : (
        <button
          onClick={handlePostuler}
          disabled={loading}
          className="rounded-md bg-vert-benovare px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Envoi…" : "Postuler"}
        </button>
      )}
    </div>
  );
}
