"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEntreprisePrestataire } from "@/components/prestataires/useEntreprisePrestataire";
import { OnboardingEntreprisePrestataire } from "@/components/prestataires/OnboardingEntreprisePrestataire";
import {
  listerMesSoumissions,
  listerProjets,
  type MaSoumission,
  type ProjetBesoin,
} from "@/lib/prestataires-api";

const STATUT_LABELS: Record<MaSoumission["statut"], string> = {
  SOUMISE: "Soumis",
  PRESELECTIONNEE: "Présélectionné",
  ENTRETIEN_PLANIFIE: "Entretien planifié",
  ENTRETIEN_FINAL: "Entretien final",
  ACCEPTEE: "Accepté",
  REFUSEE: "Non retenu",
};

export default function ProjetsEtAppelsDoffresPage() {
  const { company, loading: loadingCompany, needsOnboarding, refetch } = useEntreprisePrestataire();
  const [tab, setTab] = useState<"CATALOGUE" | "SUIVI">("CATALOGUE");
  const [projets, setProjets] = useState<ProjetBesoin[] | null>(null);
  const [soumissions, setSoumissions] = useState<MaSoumission[] | null>(null);

  useEffect(() => {
    if (!company) return;
    listerProjets().then(setProjets);
    listerMesSoumissions().then(setSoumissions);
  }, [company]);

  if (loadingCompany) return null;
  if (needsOnboarding) return <OnboardingEntreprisePrestataire onCreated={refetch} />;
  if (!company) return null;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutre-900">Projets & appels d&apos;offres</h1>

      <div className="mt-4 flex gap-2 border-b border-neutre-200">
        {(["CATALOGUE", "SUIVI"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t ? "border-b-2 border-vert-benovare text-neutre-900" : "text-neutre-600"
            }`}
          >
            {t === "CATALOGUE" ? "Catalogue" : "Suivi de mes soumissions"}
          </button>
        ))}
      </div>

      {tab === "CATALOGUE" && (
        <div className="mt-4 space-y-3">
          {projets === null && <p className="text-sm text-neutre-600">Chargement…</p>}
          {projets?.length === 0 && (
            <p className="text-sm text-neutre-600">
              Aucun appel d&apos;offres disponible pour votre palier d&apos;abonnement actuel.
            </p>
          )}
          {projets?.map((p) => (
            <Link
              key={p.id}
              href={`/prestataires/projets-et-appels-doffres/${p.id}`}
              className="block rounded-lg border border-neutre-200 bg-surface p-4 hover:bg-neutre-50"
            >
              <p className="font-medium text-neutre-900">{p.titre}</p>
              <p className="mt-1 text-xs text-neutre-600">
                {p.partenaireCompany?.raisonSociale} · budget indicatif {p.budgetIndicatif ?? "non précisé"}
              </p>
            </Link>
          ))}
        </div>
      )}

      {tab === "SUIVI" && (
        <div className="mt-4 space-y-3">
          {soumissions === null && <p className="text-sm text-neutre-600">Chargement…</p>}
          {soumissions?.length === 0 && <p className="text-sm text-neutre-600">Aucune soumission pour le moment.</p>}
          {soumissions?.map((s) => (
            <div key={s.id} className="rounded-lg border border-neutre-200 bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-neutre-900">{s.besoin.titre}</p>
                  <p className="text-xs text-neutre-600">
                    {s.besoin.partenaireCompany?.raisonSociale} · équipe proposée : {s.equipeProposee.length || 0}{" "}
                    consultant{s.equipeProposee.length > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-neutre-100 px-2.5 py-1 text-xs font-medium text-neutre-900">
                  {STATUT_LABELS[s.statut]}
                </span>
              </div>
              {s.statut === "ACCEPTEE" && s.besoin.mission && (
                <Link
                  href={`/prestataires/missions/${s.besoin.mission.id}`}
                  className="mt-3 inline-block text-sm font-medium text-vert-benovare"
                >
                  Voir la mission
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
