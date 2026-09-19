"use client";

import { useEffect, useState } from "react";
import { getReporting, type Reporting } from "@/lib/gestionnaire-api";

function formatJours(v: number | null): string {
  return v === null ? "Aucune donnée" : `${v.toFixed(1)} j`;
}

function formatPct(v: number | null): string {
  return v === null ? "Aucune donnée" : `${Math.round(v)}%`;
}

export default function ReportingPage() {
  const [data, setData] = useState<Reporting | null>(null);

  useEffect(() => {
    getReporting().then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-neutre-900">Reporting — portefeuille</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutre-200 bg-surface p-4">
          <p className="text-2xl font-semibold text-neutre-900">
            {formatJours(data.delaiMoyenSelectionJours)}
          </p>
          <p className="mt-1 text-sm text-neutre-600">Délai moyen de sélection</p>
          <p className="mt-1 text-xs text-neutre-600">Soumission → décision (candidatures acceptées ou refusées)</p>
        </div>

        <div className="rounded-xl border border-neutre-200 bg-surface p-4">
          <p className="text-2xl font-semibold text-neutre-900">{formatPct(data.tauxSatisfactionPct)}</p>
          <p className="mt-1 text-sm text-neutre-600">Taux de satisfaction</p>
          <p className="mt-1 text-xs text-neutre-600">Moyenne des évaluations bidirectionnelles</p>
        </div>

        <div className="rounded-xl border border-neutre-200 bg-surface p-4">
          <p className="text-2xl font-semibold text-neutre-900">
            {formatPct(data.missionsClotureesConformesPct)}
          </p>
          <p className="mt-1 text-sm text-neutre-600">Missions clôturées conformes</p>
        </div>

        <div className="rounded-xl border border-neutre-200 bg-surface p-4">
          <p className="text-2xl font-semibold text-neutre-900">Sur devis</p>
          <p className="mt-1 text-sm text-neutre-600">Volume d&apos;affaires suivi</p>
          <p className="mt-1 text-xs text-neutre-600">{data.missionsActives} missions actives sur le portefeuille</p>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Répartition du portefeuille
        </h2>
        <div className="mt-2 space-y-1 text-sm text-neutre-600">
          <p>Partenaires {data.repartitionPortefeuille.partenaires} comptes</p>
          <p>Talents {data.repartitionPortefeuille.talents} comptes</p>
          <p>Prestataires {data.repartitionPortefeuille.prestataires} comptes</p>
        </div>
      </section>

      <p className="text-xs text-neutre-600">
        Indicateurs calculés à partir des données réelles de la plateforme — « Aucune donnée »
        s&apos;affiche tant que le flux correspondant (clôture de mission, évaluation) n&apos;a pas
        encore été utilisé.
      </p>
    </div>
  );
}
