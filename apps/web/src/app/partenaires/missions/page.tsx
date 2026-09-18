"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEntreprise } from "@/components/partenaires/useEntreprise";
import { OnboardingEntreprise } from "@/components/partenaires/OnboardingEntreprise";
import { listerMissions, type Mission } from "@/lib/partenaires-api";

const STATUT_LABELS: Record<Mission["statut"], string> = {
  EN_COURS: "En cours",
  CLOTUREE_CONFORME: "Clôturée — conforme",
  CLOTUREE_AVEC_RESERVE: "Clôturée — avec réserve",
  CLOTUREE_LITIGE: "Clôturée — litige",
};

export default function MissionsPage() {
  const { company, loading: loadingCompany, needsOnboarding, refetch } = useEntreprise();
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [tab, setTab] = useState<"EN_COURS" | "CLOTUREES">("EN_COURS");

  useEffect(() => {
    if (!company) return;
    listerMissions().then(setMissions);
  }, [company]);

  if (loadingCompany) return null;
  if (needsOnboarding) return <OnboardingEntreprise onCreated={refetch} />;
  if (!company) return null;

  const filtered = missions?.filter((m) =>
    tab === "EN_COURS" ? m.statut === "EN_COURS" : m.statut !== "EN_COURS"
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutre-900">Missions</h1>

      <div className="mt-4 flex gap-2 border-b border-neutre-200">
        {(["EN_COURS", "CLOTUREES"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t
                ? "border-b-2 border-vert-benovare text-neutre-900"
                : "text-neutre-600"
            }`}
          >
            {t === "EN_COURS" ? "En cours" : "Clôturées"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {filtered === undefined && <p className="text-sm text-neutre-600">Chargement…</p>}
        {filtered?.length === 0 && <p className="text-sm text-neutre-600">Aucune mission.</p>}

        {filtered?.map((m) => {
          const jalonsTermines = m.jalons.filter((j) => j.statut === "TERMINE").length;
          return (
            <Link
              key={m.id}
              href={`/partenaires/missions/${m.id}`}
              className="block rounded-lg border border-neutre-200 bg-surface p-4 hover:bg-neutre-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-neutre-900">{m.besoin.titre}</p>
                  <p className="mt-1 text-xs text-neutre-600">
                    {jalonsTermines}/{m.jalons.length} jalons terminés
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-neutre-100 px-2.5 py-1 text-xs font-medium text-neutre-900">
                  {STATUT_LABELS[m.statut]}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
