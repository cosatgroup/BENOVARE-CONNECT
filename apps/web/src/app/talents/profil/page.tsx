"use client";

import { useProfilTalent } from "@/components/talents/useProfilTalent";
import { OnboardingTalent } from "@/components/talents/OnboardingTalent";

export default function ProfilPage() {
  const { profil, loading, needsOnboarding, refetch } = useProfilTalent();

  if (loading) return null;
  if (needsOnboarding) return <OnboardingTalent onCreated={refetch} />;
  if (!profil) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">Mon profil</h1>
        <p className="mt-1 text-sm text-neutre-600">
          {profil.verifie ? "Talent Vérifié" : `Talent — ${profil.prenoms} ${profil.nom}`}
          {profil.badgeMerite && " · Talent Benovare (badge de mérite)"}
          {profil.profilUnicorn && " · Profil Unicorn"}
        </p>
      </div>

      <section className="rounded-lg border border-neutre-200 bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Informations de compte
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-neutre-600">Nom &amp; prénoms</dt>
            <dd className="text-neutre-900">{profil.prenoms} {profil.nom}</dd>
          </div>
          <div>
            <dt className="text-neutre-600">LinkedIn</dt>
            <dd className="text-neutre-900">{profil.linkedin || "—"}</dd>
          </div>
          <div>
            <dt className="text-neutre-600">Adresse</dt>
            <dd className="text-neutre-900">{profil.adresse || "—"}</dd>
          </div>
          <div>
            <dt className="text-neutre-600">Disponibilité</dt>
            <dd className="text-neutre-900">
              {profil.disponibilite === "IMMEDIATE" ? "Immédiate" : "À partir d'une date"} ·{" "}
              {profil.modalite === "TEMPS_PLEIN" ? "Temps plein" : "Temps partiel"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-neutre-200 bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Benovare Trust Score
        </h2>
        <p className="mt-2 text-2xl font-semibold text-neutre-900">{profil.trustScore} / 100</p>
      </section>

      <section className="rounded-lg border border-neutre-200 bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Portefeuille de compétences
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {profil.competences.length ? (
            profil.competences.map((c) => (
              <span key={c.id} className="rounded-full bg-neutre-100 px-3 py-1 text-xs font-medium text-neutre-900">
                {c.nom}
              </span>
            ))
          ) : (
            <p className="text-sm text-neutre-600">Aucune compétence renseignée.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-neutre-200 bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Domaines d&apos;expertise
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {profil.domainesExpertise.length ? (
            profil.domainesExpertise.map((d) => (
              <span key={d.id} className="rounded-full bg-neutre-100 px-3 py-1 text-xs font-medium text-neutre-900">
                {d.nom}
              </span>
            ))
          ) : (
            <p className="text-sm text-neutre-600">Aucun domaine renseigné.</p>
          )}
        </div>
      </section>
    </div>
  );
}
