"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfilTalent } from "@/components/talents/useProfilTalent";
import { OnboardingTalent } from "@/components/talents/OnboardingTalent";
import {
  listerMesCandidatures,
  listerOpportunites,
  type MaCandidature,
  type OpportuniteBesoin,
} from "@/lib/talents-api";

const STATUT_LABELS: Record<MaCandidature["statut"], string> = {
  SOUMISE: "Soumise",
  PRESELECTIONNEE: "Présélectionnée",
  ENTRETIEN_PLANIFIE: "Entretien planifié",
  ENTRETIEN_FINAL: "Entretien final",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
};

export default function OpportunitesPage() {
  const { profil, loading: loadingProfil, needsOnboarding, refetch } = useProfilTalent();
  const [tab, setTab] = useState<"CATALOGUE" | "SUIVI">("CATALOGUE");
  const [onglet, setOnglet] = useState<"PARTENAIRES" | "PRESTATAIRES">("PARTENAIRES");
  const [avis, setAvis] = useState<{ avisPartenaires: OpportuniteBesoin[]; avisPrestataires: OpportuniteBesoin[] } | null>(null);
  const [candidatures, setCandidatures] = useState<MaCandidature[] | null>(null);

  useEffect(() => {
    if (!profil) return;
    listerOpportunites().then(setAvis);
    listerMesCandidatures().then(setCandidatures);
  }, [profil]);

  if (loadingProfil) return null;
  if (needsOnboarding) return <OnboardingTalent onCreated={refetch} />;
  if (!profil) return null;

  const listeAvis = onglet === "PARTENAIRES" ? avis?.avisPartenaires : avis?.avisPrestataires;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutre-900">Opportunités</h1>

      <div className="mt-4 flex gap-2 border-b border-neutre-200">
        {(["CATALOGUE", "SUIVI"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t ? "border-b-2 border-vert-benovare text-neutre-900" : "text-neutre-600"
            }`}
          >
            {t === "CATALOGUE" ? "Catalogue" : "Suivi de mes candidatures"}
          </button>
        ))}
      </div>

      {tab === "CATALOGUE" && (
        <div className="mt-4">
          <div className="flex gap-2">
            {(["PARTENAIRES", "PRESTATAIRES"] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOnglet(o)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  onglet === o ? "bg-vert-benovare text-white" : "bg-neutre-100 text-neutre-900"
                }`}
              >
                {o === "PARTENAIRES" ? "Avis de recrutement — Partenaires" : "Recherche de talents — Prestataires"}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {listeAvis === undefined && <p className="text-sm text-neutre-600">Chargement…</p>}
            {listeAvis?.length === 0 && (
              <p className="text-sm text-neutre-600">
                Aucun avis disponible pour votre palier d&apos;abonnement actuel.
              </p>
            )}
            {listeAvis?.map((b) => (
              <Link
                key={b.id}
                href={`/talents/opportunites/${b.id}`}
                className="block rounded-lg border border-neutre-200 bg-surface p-4 hover:bg-neutre-50"
              >
                <p className="font-medium text-neutre-900">{b.titre}</p>
                <p className="mt-1 text-xs text-neutre-600">
                  {onglet === "PARTENAIRES" ? b.partenaireCompany?.raisonSociale : "Prestataire"} ·{" "}
                  {b.niveauEtoiles} étoile{b.niveauEtoiles > 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === "SUIVI" && (
        <div className="mt-4 space-y-3">
          {candidatures === null && <p className="text-sm text-neutre-600">Chargement…</p>}
          {candidatures?.length === 0 && (
            <p className="text-sm text-neutre-600">Aucune candidature pour le moment.</p>
          )}
          {candidatures?.map((c) => (
            <div key={c.id} className="rounded-lg border border-neutre-200 bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-neutre-900">{c.besoin.titre}</p>
                  <p className="text-xs text-neutre-600">{c.besoin.partenaireCompany?.raisonSociale}</p>
                </div>
                <span className="shrink-0 rounded-full bg-neutre-100 px-2.5 py-1 text-xs font-medium text-neutre-900">
                  {STATUT_LABELS[c.statut]}
                </span>
              </div>
              {c.statut === "ACCEPTEE" && c.besoin.mission && (
                <Link
                  href={`/talents/opportunites/mission/${c.besoin.mission.id}`}
                  className="mt-3 inline-block text-sm font-medium text-vert-benovare"
                >
                  Voir le pilotage
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
