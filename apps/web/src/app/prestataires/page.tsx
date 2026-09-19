"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEntreprisePrestataire } from "@/components/prestataires/useEntreprisePrestataire";
import { OnboardingEntreprisePrestataire } from "@/components/prestataires/OnboardingEntreprisePrestataire";
import {
  listerMesMissions,
  listerMesSoumissions,
  type MaSoumission,
  type PrestataireMission,
} from "@/lib/prestataires-api";

export default function PrestatairesDashboard() {
  const { company, loading: loadingCompany, needsOnboarding, refetch } = useEntreprisePrestataire();
  const [soumissions, setSoumissions] = useState<MaSoumission[]>([]);
  const [missions, setMissions] = useState<PrestataireMission[]>([]);

  useEffect(() => {
    if (!company) return;
    listerMesSoumissions().then(setSoumissions);
    listerMesMissions().then(setMissions);
  }, [company]);

  if (loadingCompany) return null;
  if (needsOnboarding) return <OnboardingEntreprisePrestataire onCreated={refetch} />;
  if (!company) return null;

  const soumissionsEnCours = soumissions.filter((s) => !["ACCEPTEE", "REFUSEE"].includes(s.statut));
  const missionsActives = missions.filter((m) => m.statut === "EN_COURS");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-neutre-600">{company.raisonSociale}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Trust Score" value={`${company.trustScore}/100`} href="/prestataires/profil-entreprise" />
        <StatCard
          label="Appels d'offres en soumission"
          value={soumissionsEnCours.length}
          href="/prestataires/projets-et-appels-doffres"
        />
        <StatCard label="Missions actives" value={missionsActives.length} href="/prestataires/missions" />
      </div>

      {(company.badgeMerite || company.profilUnicorn) && (
        <div className="flex gap-2">
          {company.badgeMerite && (
            <span className="rounded-full bg-neutre-100 px-3 py-1 text-xs font-medium text-neutre-900">
              Badge de mérite
            </span>
          )}
          {company.profilUnicorn && (
            <span className="rounded-full bg-orange-accent/20 px-3 py-1 text-xs font-medium text-orange-fonce">
              Profil Unicorn
            </span>
          )}
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">Équipe</h2>
        <p className="mt-2 text-sm text-neutre-600">
          {company.membres.length} collaborateur{company.membres.length > 1 ? "s" : ""} rattaché
          {company.membres.length > 1 ? "s" : ""}.{" "}
          <Link href="/prestataires/profil-entreprise" className="text-vert-benovare font-medium">
            Voir le profil entreprise
          </Link>
        </p>
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-neutre-200 bg-surface p-4 hover:bg-neutre-50">
      <p className="text-2xl font-semibold text-neutre-900">{value}</p>
      <p className="mt-1 text-sm text-neutre-600">{label}</p>
    </Link>
  );
}
