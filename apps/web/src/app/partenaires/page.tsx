"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEntreprise } from "@/components/partenaires/useEntreprise";
import { OnboardingEntreprise } from "@/components/partenaires/OnboardingEntreprise";
import { listerBesoins, listerCandidatures, listerMissions, type Besoin, type Candidature, type Mission } from "@/lib/partenaires-api";

export default function PartenairesDashboard() {
  const { company, loading: loadingCompany, needsOnboarding, refetch } = useEntreprise();
  const [besoins, setBesoins] = useState<Besoin[]>([]);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    if (!company) return;
    listerBesoins().then(setBesoins);
    listerCandidatures().then(setCandidatures);
    listerMissions().then(setMissions);
  }, [company]);

  if (loadingCompany) return null;
  if (needsOnboarding) return <OnboardingEntreprise onCreated={refetch} />;
  if (!company) return null;

  const candidaturesEnAttente = candidatures.filter((c) => !["ACCEPTEE", "REFUSEE"].includes(c.statut));
  const missionsActives = missions.filter((m) => m.statut === "EN_COURS");
  const missionsCloturees = missions.filter((m) => m.statut !== "EN_COURS");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-neutre-600">{company.raisonSociale}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Besoins publiés" value={besoins.length} href="/partenaires/publier-un-besoin" />
        <StatCard label="Candidatures à traiter" value={candidaturesEnAttente.length} href="/partenaires/candidatures" />
        <StatCard label="Missions actives" value={missionsActives.length} href="/partenaires/missions" />
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Besoins publiés récemment
        </h2>
        <div className="mt-2 space-y-2">
          {besoins.slice(0, 5).map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-md border border-neutre-200 bg-surface px-3 py-2 text-sm">
              <span className="text-neutre-900">{b.titre}</span>
              <span className="text-xs text-neutre-600">
                {b.statut === "OUVERT" ? "Ouvert" : b.statut === "EN_EVALUATION" ? "En évaluation" : "Clos"}
                {b._count ? ` · ${b._count.candidatures} candidatures` : ""}
              </span>
            </div>
          ))}
          {besoins.length === 0 && (
            <p className="text-sm text-neutre-600">
              Aucun besoin publié.{" "}
              <Link href="/partenaires/publier-un-besoin" className="text-vert-benovare font-medium">
                Publier un besoin
              </Link>
            </p>
          )}
        </div>
      </section>

      {missionsCloturees.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
            Missions clôturées
          </h2>
          <p className="mt-1 text-sm text-neutre-600">{missionsCloturees.length} mission(s) clôturée(s).</p>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-neutre-200 bg-surface p-4 hover:bg-neutre-50"
    >
      <p className="text-2xl font-semibold text-neutre-900">{value}</p>
      <p className="mt-1 text-sm text-neutre-600">{label}</p>
    </Link>
  );
}
