"use client";

import { useState } from "react";
import { useEntreprisePrestataire } from "@/components/prestataires/useEntreprisePrestataire";
import { OnboardingEntreprisePrestataire } from "@/components/prestataires/OnboardingEntreprisePrestataire";
import { choisirPalier } from "@/lib/prestataires-api";
import { GestionDevisEtLicence } from "@/components/abonnement/GestionDevisEtLicence";

const FORMULES = [
  {
    value: "SILVER" as const,
    nom: "Silver",
    avantages: ["2 missions simultanées", "3 collaborateurs rattachés", "Accès aux appels d'offres 1 à 2 étoiles"],
  },
  {
    value: "GOLD" as const,
    nom: "Gold",
    avantages: ["5 missions simultanées", "8 collaborateurs rattachés", "Accès aux appels d'offres 1 à 3 étoiles", "Badge de mérite prioritaire"],
  },
  {
    value: "PLATINUM" as const,
    nom: "Platinum",
    avantages: ["Missions simultanées illimitées", "Collaborateurs illimités", "Accès aux appels d'offres 1 à 4 étoiles", "Accompagnement dédié"],
  },
];

export default function AbonnementPrestatairePage() {
  const { company, loading, needsOnboarding, refetch } = useEntreprisePrestataire();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (needsOnboarding) return <OnboardingEntreprisePrestataire onCreated={refetch} />;
  if (!company) return null;

  const formuleActuelle = company.subscription?.palierEtoiles ?? null;

  async function handleChoose(palier: "SILVER" | "GOLD" | "PLATINUM") {
    setPending(palier);
    setError(null);
    try {
      await choisirPalier(palier);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-neutre-900">Abonnement</h1>
      {error && <p className="mt-2 text-sm text-orange-fonce">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FORMULES.map((f) => {
          const isCurrent = formuleActuelle === f.value;
          return (
            <div key={f.value} className="flex flex-col rounded-xl border border-neutre-200 bg-surface p-5">
              <h2 className="font-semibold text-neutre-900">{f.nom}</h2>
              <p className="mt-3 text-sm font-medium text-neutre-900">Sur devis</p>
              <ul className="mt-3 flex-1 space-y-1.5 text-sm text-neutre-600">
                {f.avantages.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <button
                onClick={() => handleChoose(f.value)}
                disabled={isCurrent || pending === f.value}
                className={`mt-4 rounded-md px-3 py-2 text-sm font-medium ${
                  isCurrent ? "bg-neutre-100 text-neutre-600" : "bg-vert-benovare text-white hover:opacity-90"
                } disabled:opacity-50`}
              >
                {isCurrent ? "Formule actuelle" : pending === f.value ? "…" : "Passer à cette formule"}
              </button>
            </div>
          );
        })}
      </div>

      <GestionDevisEtLicence onActivated={refetch} />
    </div>
  );
}
