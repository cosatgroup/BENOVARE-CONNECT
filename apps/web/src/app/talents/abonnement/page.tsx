"use client";

import { useProfilTalent } from "@/components/talents/useProfilTalent";
import { OnboardingTalent } from "@/components/talents/OnboardingTalent";
import { GestionDevisEtLicence } from "@/components/abonnement/GestionDevisEtLicence";

const FORMULES = [
  {
    value: "SILVER" as const,
    nom: "Silver",
    description: "Accès aux besoins 1 à 2 étoiles.",
    avantages: ["Opportunités jusqu'à 2 étoiles", "Profil, Trust Score, CV généré", "Programme de parrainage"],
  },
  {
    value: "GOLD" as const,
    nom: "Gold",
    description: "Accès aux besoins 1 à 3 étoiles.",
    avantages: ["Tout Silver, plus :", "Opportunités jusqu'à 3 étoiles", "Éligibilité au badge de mérite et au statut Unicorn"],
  },
  {
    value: "PLATINUM" as const,
    nom: "Platinum",
    description: "Accès aux besoins 1 à 4 étoiles.",
    avantages: ["Tout Gold, plus :", "Opportunités jusqu'à 4 étoiles", "Accès privilégié aux missions à fort enjeu"],
  },
];

export default function AbonnementTalentPage() {
  const { profil, loading, needsOnboarding, refetch } = useProfilTalent();

  if (loading) return null;
  if (needsOnboarding) return <OnboardingTalent onCreated={refetch} />;
  if (!profil) return null;

  const formuleActuelle = profil.subscription?.palierEtoiles ?? null;

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-neutre-900">Abonnement</h1>
      <p className="mt-1 text-sm text-neutre-600">
        Votre formule détermine le niveau d&apos;exigence des besoins auxquels vous avez accès.
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
              <p className="mt-1 text-sm text-neutre-600">{f.description}</p>
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
