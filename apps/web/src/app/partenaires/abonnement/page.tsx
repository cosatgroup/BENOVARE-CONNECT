"use client";

import { useState } from "react";
import { useEntreprise } from "@/components/partenaires/useEntreprise";
import { OnboardingEntreprise } from "@/components/partenaires/OnboardingEntreprise";
import { choisirFormule } from "@/lib/partenaires-api";

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
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loadingCompany) return null;
  if (needsOnboarding) return <OnboardingEntreprise onCreated={refetch} />;
  if (!company) return null;

  const formuleActuelle = company.subscription?.formulePartenaire ?? null;

  async function handleChoose(formule: "ESSENTIEL" | "BUSINESS" | "ENTERPRISE") {
    setPending(formule);
    setError(null);
    try {
      await choisirFormule(formule);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-neutre-900">Abonnement — Formule partenaire</h1>
      {error && <p className="mt-2 text-sm text-orange-fonce">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FORMULES.map((f) => {
          const isCurrent = formuleActuelle === f.value;
          return (
            <div key={f.value} className="flex flex-col rounded-xl border border-neutre-200 bg-surface p-5">
              <h2 className="font-semibold text-neutre-900">{f.nom}</h2>
              <p className="mt-1 text-sm text-neutre-600">{f.description}</p>
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
                  isCurrent
                    ? "bg-neutre-100 text-neutre-600"
                    : "bg-vert-benovare text-white hover:opacity-90"
                } disabled:opacity-50`}
              >
                {isCurrent ? "Formule actuelle" : pending === f.value ? "…" : "Passer à cette formule"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
