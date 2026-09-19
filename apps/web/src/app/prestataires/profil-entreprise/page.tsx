"use client";

import { useEntreprisePrestataire } from "@/components/prestataires/useEntreprisePrestataire";
import { OnboardingEntreprisePrestataire } from "@/components/prestataires/OnboardingEntreprisePrestataire";

export default function ProfilEntreprisePage() {
  const { company, loading, needsOnboarding, refetch } = useEntreprisePrestataire();

  if (loading) return null;
  if (needsOnboarding) return <OnboardingEntreprisePrestataire onCreated={refetch} />;
  if (!company) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">Profil entreprise</h1>
        <p className="mt-1 text-sm text-neutre-600">
          Prestataire — {company.raisonSociale}
          {company.badgeMerite && " · Badge de mérite"}
          {company.profilUnicorn && " · Profil Unicorn"}
        </p>
      </div>

      <section className="rounded-lg border border-neutre-200 bg-surface p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-neutre-600">Raison sociale</dt>
            <dd className="text-neutre-900">{company.raisonSociale}</dd>
          </div>
          <div>
            <dt className="text-neutre-600">Secteur d&apos;activité</dt>
            <dd className="text-neutre-900">{company.secteurActivite || "—"}</dd>
          </div>
          <div>
            <dt className="text-neutre-600">Effectif</dt>
            <dd className="text-neutre-900">{company.effectif ? `${company.effectif} collaborateurs` : "—"}</dd>
          </div>
          <div>
            <dt className="text-neutre-600">Année de création</dt>
            <dd className="text-neutre-900">{company.anneeCreation || "—"}</dd>
          </div>
          <div>
            <dt className="text-neutre-600">Coordonnées</dt>
            <dd className="text-neutre-900">{company.coordonnees || "—"}</dd>
          </div>
          <div>
            <dt className="text-neutre-600">Conformité KYB</dt>
            <dd className="text-neutre-900">{company.verifieKYB ? "Conforme" : "En attente de validation"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-neutre-200 bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Benovare Trust Score
        </h2>
        <p className="mt-2 text-2xl font-semibold text-neutre-900">{company.trustScore} / 100</p>
      </section>

      <section className="rounded-lg border border-neutre-200 bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Collaborateurs rattachés
        </h2>
        <div className="mt-2 space-y-2">
          {company.membres.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-md bg-neutre-50 px-3 py-2 text-sm"
            >
              <span className="text-neutre-900">{m.nom}</span>
              <span className="text-xs text-neutre-600">{roleLabel(m.role)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function roleLabel(role: string): string {
  switch (role) {
    case "REPRESENTANT_LEGAL":
      return "Représentant légal";
    case "GESTIONNAIRE_MISSIONS":
      return "Gestionnaire de missions";
    case "CONSULTANT_TECHNIQUE":
      return "Consultant technique";
    case "COMPTABILITE":
      return "Comptabilité";
    default:
      return role;
  }
}
