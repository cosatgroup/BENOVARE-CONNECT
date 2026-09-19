"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listerMissionsGestionnaire, type GestionnaireMission } from "@/lib/gestionnaire-api";

export default function PilotageDesMissionsPage() {
  const [missions, setMissions] = useState<GestionnaireMission[] | null>(null);

  useEffect(() => {
    listerMissionsGestionnaire().then(setMissions);
  }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutre-900">Pilotage des missions</h1>

      <div className="mt-4 space-y-3">
        {missions === null && <p className="text-sm text-neutre-600">Chargement…</p>}
        {missions?.length === 0 && <p className="text-sm text-neutre-600">Aucune mission suivie.</p>}
        {missions?.map((m) => {
          const demandesEnAttente = m.demandes.filter((d) => d.statut === "EN_ATTENTE").length;
          return (
            <Link
              key={m.id}
              href={`/gestionnaire/pilotage-des-missions/${m.id}`}
              className="block rounded-lg border border-neutre-200 bg-surface p-4 hover:bg-neutre-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-neutre-900">{m.besoin.titre}</p>
                  <p className="text-xs text-neutre-600">{m.besoin.partenaireCompany?.raisonSociale}</p>
                </div>
                {demandesEnAttente > 0 && (
                  <span className="shrink-0 rounded-full bg-orange-accent/20 px-2.5 py-1 text-xs font-medium text-orange-fonce">
                    {demandesEnAttente} demande{demandesEnAttente > 1 ? "s" : ""} à instruire
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
