"use client";

import { useEffect, useState } from "react";
import { useEntreprise } from "@/components/partenaires/useEntreprise";
import { OnboardingEntreprise } from "@/components/partenaires/OnboardingEntreprise";
import { decisionCandidature, listerCandidatures, type Candidature } from "@/lib/partenaires-api";

const STATUT_LABELS: Record<Candidature["statut"], string> = {
  SOUMISE: "Soumise",
  PRESELECTIONNEE: "Présélectionnée",
  ENTRETIEN_PLANIFIE: "Entretien planifié",
  ENTRETIEN_FINAL: "Entretien final à mener",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
};

function nomCandidat(c: Candidature): string {
  if (c.talent) return `${c.talent.prenoms} ${c.talent.nom}`;
  if (c.prestataireCompany) return c.prestataireCompany.raisonSociale;
  return "Candidat";
}

function trustScore(c: Candidature): number | null {
  return c.talent?.trustScore ?? c.prestataireCompany?.trustScore ?? null;
}

export default function CandidaturesPage() {
  const { company, loading: loadingCompany, needsOnboarding, refetch } = useEntreprise();
  const [candidatures, setCandidatures] = useState<Candidature[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!company) return;
    listerCandidatures()
      .then(setCandidatures)
      .catch((err) => setError(err instanceof Error ? err.message : "Une erreur est survenue"));
  }, [company]);

  if (loadingCompany) return null;
  if (needsOnboarding) return <OnboardingEntreprise onCreated={refetch} />;
  if (!company) return null;

  async function handleDecision(id: string, decision: "ACCEPTEE" | "REFUSEE") {
    setPendingId(id);
    setError(null);
    try {
      const updated = await decisionCandidature(id, decision);
      setCandidatures((prev) => prev?.map((c) => (c.id === id ? { ...c, statut: updated.statut } : c)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutre-900">Candidatures et sélection</h1>
      <p className="mt-1 text-sm text-neutre-600">
        Premier entretien mené par votre Gestionnaire de compte. Vous conduisez l&apos;entretien
        final avant la décision.
      </p>

      {error && <p className="mt-4 text-sm text-orange-fonce">{error}</p>}

      <div className="mt-6 space-y-3">
        {candidatures === null && <p className="text-sm text-neutre-600">Chargement…</p>}
        {candidatures?.length === 0 && (
          <p className="text-sm text-neutre-600">Aucune candidature pour le moment.</p>
        )}

        {candidatures?.map((c) => {
          const premierEntretien = c.entretiens.find((e) => e.type === "PREMIER_ENTRETIEN_BENOVARE");
          const score = trustScore(c);
          return (
            <div key={c.id} className="rounded-lg border border-neutre-200 bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-neutre-900">{nomCandidat(c)}</p>
                  <p className="text-sm text-neutre-600">{c.besoin?.titre}</p>
                  {score !== null && (
                    <p className="mt-1 text-xs text-neutre-600">Trust Score {score}/100</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-neutre-100 px-2.5 py-1 text-xs font-medium text-neutre-900">
                  {STATUT_LABELS[c.statut]}
                </span>
              </div>

              {premierEntretien && (
                <div className="mt-3 rounded-md bg-neutre-50 p-3 text-sm">
                  <p className="font-medium text-neutre-900">Résultat du premier entretien</p>
                  <p className="text-neutre-600">
                    {premierEntretien.resultat === "EN_ATTENTE"
                      ? "En cours d'évaluation par le Gestionnaire de compte."
                      : premierEntretien.compteRendu ?? premierEntretien.resultat}
                  </p>
                </div>
              )}

              {(c.statut === "ENTRETIEN_FINAL" || c.statut === "PRESELECTIONNEE") && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleDecision(c.id, "ACCEPTEE")}
                    disabled={pendingId === c.id}
                    className="rounded-md bg-vert-benovare px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Accepter la candidature
                  </button>
                  <button
                    onClick={() => handleDecision(c.id, "REFUSEE")}
                    disabled={pendingId === c.id}
                    className="rounded-md border border-neutre-200 px-3 py-1.5 text-sm font-medium text-neutre-900 hover:bg-neutre-50 disabled:opacity-50"
                  >
                    Refuser
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
