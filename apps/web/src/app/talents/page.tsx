"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfilTalent } from "@/components/talents/useProfilTalent";
import { OnboardingTalent } from "@/components/talents/OnboardingTalent";
import { listerMesCandidatures, listerMesMissions, type MaCandidature, type TalentMission } from "@/lib/talents-api";

export default function TalentsDashboard() {
  const { profil, loading: loadingProfil, needsOnboarding, refetch } = useProfilTalent();
  const [candidatures, setCandidatures] = useState<MaCandidature[]>([]);
  const [missions, setMissions] = useState<TalentMission[]>([]);

  useEffect(() => {
    if (!profil) return;
    listerMesCandidatures().then(setCandidatures);
    listerMesMissions().then(setMissions);
  }, [profil]);

  if (loadingProfil) return null;
  if (needsOnboarding) return <OnboardingTalent onCreated={refetch} />;
  if (!profil) return null;

  const candidaturesEnCours = candidatures.filter((c) => !["ACCEPTEE", "REFUSEE"].includes(c.statut));
  const missionsActives = missions.filter((m) => m.statut === "EN_COURS");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-neutre-600">
          {profil.prenoms} {profil.nom}
          {profil.subscription?.palierEtoiles ? ` — Formule ${formuleLabel(profil.subscription.palierEtoiles)}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Trust Score" value={`${profil.trustScore}/100`} href="/talents/profil" />
        <StatCard label="Candidatures en cours" value={candidaturesEnCours.length} href="/talents/opportunites" />
        <StatCard label="Missions en cours" value={missionsActives.length} href="/talents/opportunites" />
      </div>

      {(profil.badgeMerite || profil.profilUnicorn) && (
        <div className="flex gap-2">
          {profil.badgeMerite && (
            <span className="rounded-full bg-neutre-100 px-3 py-1 text-xs font-medium text-neutre-900">
              Badge de mérite
            </span>
          )}
          {profil.profilUnicorn && (
            <span className="rounded-full bg-orange-accent/20 px-3 py-1 text-xs font-medium text-orange-fonce">
              Profil Unicorn
            </span>
          )}
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Opportunités recommandées
        </h2>
        <p className="mt-2 text-sm text-neutre-600">
          Consultez le catalogue filtré selon votre formule.{" "}
          <Link href="/talents/opportunites" className="text-vert-benovare font-medium">
            Voir les opportunités
          </Link>
        </p>
      </section>
    </div>
  );
}

function formuleLabel(palier: string): string {
  return palier === "SILVER" ? "Silver" : palier === "GOLD" ? "Gold" : "Platinum";
}

function StatCard({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-neutre-200 bg-surface p-4 hover:bg-neutre-50">
      <p className="text-2xl font-semibold text-neutre-900">{value}</p>
      <p className="mt-1 text-sm text-neutre-600">{label}</p>
    </Link>
  );
}
