"use client";

import { useState } from "react";
import { useProfilTalent } from "@/components/talents/useProfilTalent";
import { OnboardingTalent } from "@/components/talents/OnboardingTalent";
import { choisirPalier } from "@/lib/talents-api";

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
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (needsOnboarding) return <OnboardingTalent onCreated={refetch} />;
  if (!profil) return null;

  const formuleActuelle = profil.subscription?.palierEtoiles ?? null;

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
      <p className="mt-1 text-sm text-neutre-600">
        Votre formule détermine le niveau d&apos;exigence des besoins auxquels vous avez accès. Le
        changement de formule est proratisé automatiquement.
      </p>
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
                  isCurrent ? "bg-neutre-100 text-neutre-600" : "bg-vert-benovare text-white hover:opacity-90"
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
