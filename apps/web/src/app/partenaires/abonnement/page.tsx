"use client";

import { useEntreprise } from "@/components/partenaires/useEntreprise";
import { OnboardingEntreprise } from "@/components/partenaires/OnboardingEntreprise";
import { GestionDevisEtLicence } from "@/components/abonnement/GestionDevisEtLicence";

const FORMULES = [
  {
    value: "ESSENTIEL" as const,
    nom: "Essentiel",
    description: "Publiez vos besoins et gérez la sélection vous-même.",
    avantages: ["Besoins de recrutement illimités", "Mise en relation simple", "Accès au catalogue Talents & Prestataires"],
  },
  {
    value: "BUSINESS" as const,
    nom: "Business",
    description: "Benovare coordonne les entretiens à vos côtés.",
    avantages: ["Tout Essentiel, plus :", "Gestionnaire de compte dédié", "Coordination des entretiens par Benovare"],
  },
  {
    value: "ENTERPRISE" as const,
    nom: "Enterprise",
    description: "Benovare pilote vos missions de bout en bout.",
    avantages: ["Tout Business, plus :", "Accompagnement complet avec pilotage", "Volume de missions illimité", "Tarification préférentielle au volume"],
  },
];

export default function AbonnementPage() {
  const { company, loading: loadingCompany, needsOnboarding, refetch } = useEntreprise();

  if (loadingCompany) return null;
  if (needsOnboarding) return <OnboardingEntreprise onCreated={refetch} />;
  if (!company) return null;

  const formuleActuelle = company.subscription?.formulePartenaire ?? null;

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-neutre-900">Abonnement — Formule partenaire</h1>
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
