"use client";

import { use, useEffect, useState } from "react";
import {
  getMissionGestionnaire,
  recommanderDemande,
  validerLivrable,
  type GestionnaireMission,
} from "@/lib/gestionnaire-api";

export default function PilotageMissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mission, setMission] = useState<GestionnaireMission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommandationParDemande, setRecommandationParDemande] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);

  function refresh() {
    getMissionGestionnaire(id)
      .then(setMission)
      .catch((err) => setError(err instanceof Error ? err.message : "Une erreur est survenue"));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <p className="text-sm text-orange-fonce">{error}</p>;
  if (!mission) return null;

  async function handleRecommander(demandeId: string) {
    const recommandation = recommandationParDemande[demandeId];
    if (!recommandation?.trim()) return;
    setPending(demandeId);
    try {
      await recommanderDemande(id, demandeId, recommandation);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setPending(null);
    }
  }

  async function handleValiderLivrable(livrableId: string) {
    setPending(livrableId);
    try {
      await validerLivrable(id, livrableId);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">{mission.besoin.titre}</h1>
        <p className="text-sm text-neutre-600">{mission.besoin.partenaireCompany?.raisonSociale}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Demandes de délai / avenant
        </h2>
        <div className="mt-2 space-y-3">
          {mission.demandes.length === 0 && <p className="text-sm text-neutre-600">Aucune demande.</p>}
          {mission.demandes.map((d) => (
            <div key={d.id} className="rounded-lg border border-neutre-200 bg-surface p-4">
              <p className="text-sm text-neutre-900">{d.motif}</p>
              <p className="mt-1 text-xs text-neutre-600">Statut : {d.statut}</p>
              {d.recommandationGestionnaire ? (
                <p className="mt-2 text-sm text-neutre-600">
                  Recommandation transmise : {d.recommandationGestionnaire}
                </p>
              ) : d.statut === "EN_ATTENTE" ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={recommandationParDemande[d.id] ?? ""}
                    onChange={(e) =>
                      setRecommandationParDemande((s) => ({ ...s, [d.id]: e.target.value }))
                    }
                    placeholder="Analyse de complexité et recommandation à transmettre au Partenaire…"
                    rows={2}
                    className="w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => handleRecommander(d.id)}
                    disabled={pending === d.id}
                    className="rounded-md bg-vert-benovare px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Transmettre au Partenaire
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Livrables à valider
        </h2>
        <div className="mt-2 space-y-2">
          {mission.livrables.length === 0 && <p className="text-sm text-neutre-600">Aucun livrable déposé.</p>}
          {mission.livrables.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-md border border-neutre-200 bg-surface px-3 py-2 text-sm"
            >
              <span className="text-neutre-900">{l.nom}</span>
              {l.valide ? (
                <span className="text-xs text-neutre-600">Validé</span>
              ) : (
                <button
                  onClick={() => handleValiderLivrable(l.id)}
                  disabled={pending === l.id}
                  className="rounded-md bg-vert-benovare px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  Valider
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
