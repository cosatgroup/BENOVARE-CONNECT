"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard, type AdminDashboard } from "@/lib/administrateur-api";

export default function AdministrateurDashboard() {
  const [data, setData] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    getDashboard().then(setData);
  }, []);

  if (!data) return null;

  const comptesActifs =
    data.comptesActifsParType.talents + data.comptesActifsParType.prestataires + data.comptesActifsParType.partenaires;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-neutre-900">Tableau de bord global</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutre-200 bg-surface p-4">
          <p className="text-2xl font-semibold text-neutre-900">{comptesActifs}</p>
          <p className="mt-1 text-sm text-neutre-600">Comptes actifs par type</p>
          <div className="mt-3 space-y-1 text-xs text-neutre-600">
            <p>Partenaires {data.comptesActifsParType.partenaires}</p>
            <p>Talents {data.comptesActifsParType.talents}</p>
            <p>Prestataires {data.comptesActifsParType.prestataires}</p>
          </div>
        </div>

        <Link
          href="/administrateur/gestion-des-utilisateurs"
          className="rounded-xl border border-neutre-200 bg-surface p-4 hover:bg-neutre-50"
        >
          <p className="text-2xl font-semibold text-neutre-900">{data.missionsEnCours}</p>
          <p className="mt-1 text-sm text-neutre-600">Missions en cours</p>
          <p className="mt-3 text-xs text-neutre-600">{data.missionsCloturees} missions clôturées</p>
        </Link>
      </div>

      {data.litigesOuverts > 0 && (
        <div className="rounded-lg border border-neutre-200 bg-surface p-4 text-sm">
          <p className="font-medium text-neutre-900">Alertes système</p>
          <p className="mt-1 text-neutre-600">
            {data.litigesOuverts} litige{data.litigesOuverts > 1 ? "s" : ""} escaladé
            {data.litigesOuverts > 1 ? "s" : ""} en attente d&apos;arbitrage.
          </p>
        </div>
      )}
    </div>
  );
}
