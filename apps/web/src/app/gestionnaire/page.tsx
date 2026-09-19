"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard, type GestionnaireDashboard } from "@/lib/gestionnaire-api";

export default function GestionnaireDashboardPage() {
  const [data, setData] = useState<GestionnaireDashboard | null>(null);

  useEffect(() => {
    getDashboard().then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-neutre-900">Tableau de bord — portefeuille</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Candidatures à traiter"
          value={data.candidaturesEnAttente}
          href="/gestionnaire/sourcing-et-selection"
        />
        <StatCard label="Missions actives" value={data.missionsActives} href="/gestionnaire/pilotage-des-missions" />
        <StatCard label="Comptes à valider" value={data.comptesAValider} href="/gestionnaire/gestion-des-comptes" />
      </div>

      <div className="rounded-lg border border-neutre-200 bg-surface p-4 text-sm text-neutre-600">
        <p className="font-medium text-neutre-900">Sélection en deux temps</p>
        <p className="mt-1">
          Premier entretien conduit par vous, puis entretien final du Partenaire — décision finale
          lui appartient.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-neutre-200 bg-surface p-4 hover:bg-neutre-50">
      <p className="text-2xl font-semibold text-neutre-900">{value}</p>
      <p className="mt-1 text-sm text-neutre-600">{label}</p>
    </Link>
  );
}
