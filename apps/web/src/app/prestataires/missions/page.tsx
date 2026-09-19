"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listerMesMissions, type PrestataireMission } from "@/lib/prestataires-api";

const STATUT_LABELS: Record<PrestataireMission["statut"], string> = {
  EN_COURS: "En cours",
  CLOTUREE_CONFORME: "Clôturée — conforme",
  CLOTUREE_AVEC_RESERVE: "Clôturée — avec réserve",
  CLOTUREE_LITIGE: "Clôturée — litige",
};

export default function PrestataireMissionsPage() {
  const [missions, setMissions] = useState<PrestataireMission[] | null>(null);

  useEffect(() => {
    listerMesMissions().then(setMissions);
  }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutre-900">Missions</h1>

      <div className="mt-4 space-y-3">
        {missions === null && <p className="text-sm text-neutre-600">Chargement…</p>}
        {missions?.length === 0 && <p className="text-sm text-neutre-600">Aucune mission active.</p>}
        {missions?.map((m) => (
          <Link
            key={m.id}
            href={`/prestataires/missions/${m.id}`}
            className="block rounded-lg border border-neutre-200 bg-surface p-4 hover:bg-neutre-50"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-neutre-900">{m.besoin.titre}</p>
                <p className="mt-1 text-xs text-neutre-600">{m.besoin.partenaireCompany?.raisonSociale}</p>
              </div>
              <span className="shrink-0 rounded-full bg-neutre-100 px-2.5 py-1 text-xs font-medium text-neutre-900">
                {STATUT_LABELS[m.statut]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
