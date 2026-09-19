"use client";

import { useEntreprisePrestataire } from "@/components/prestataires/useEntreprisePrestataire";
import { OnboardingEntreprisePrestataire } from "@/components/prestataires/OnboardingEntreprisePrestataire";
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

  if (loading) return null;
  if (needsOnboarding) return <OnboardingEntreprisePrestataire onCreated={refetch} />;
  if (!company) return null;

  const formuleActuelle = company.subscription?.palierEtoiles ?? null;

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-neutre-900">Abonnement</h1>
      <p className="mt-1 text-sm text-neutre-600">
        Chaque formule est établie sur devis par Benovare : contactez-nous pour en demander une, puis
        réglez le devis reçu ci-dessous pour l&apos;activer.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FORMULES.map((f) => {
          const isCurrent = formuleActuelle === f.value;
          return (
            <div
              key={f.value}
              className={`flex flex-col rounded-xl border p-5 ${
                isCurrent ? "border-vert-benovare bg-surface" : "border-neutre-200 bg-surface"
              }`}
            >
              <h2 className="font-semibold text-neutre-900">{f.nom}</h2>
              <p className="mt-3 text-sm font-medium text-neutre-900">Sur devis</p>
              <ul className="mt-3 flex-1 space-y-1.5 text-sm text-neutre-600">
                {f.avantages.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              {isCurrent && (
                <p className="mt-4 rounded-md bg-neutre-100 px-3 py-2 text-center text-sm font-medium text-neutre-600">
                  Formule actuelle
                </p>
              )}
            </div>
          );
        })}
      </div>

      <GestionDevisEtLicence onActivated={refetch} />
    </div>
  );
}
