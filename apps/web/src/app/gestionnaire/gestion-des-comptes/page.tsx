"use client";

import { useEffect, useState } from "react";
import { listerComptes, validerCompte, type ComptesResponse } from "@/lib/gestionnaire-api";

export default function GestionDesComptesPage() {
  const [comptes, setComptes] = useState<ComptesResponse | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  function refresh() {
    listerComptes().then(setComptes);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!comptes) return null;

  async function handleValider(type: "partenaire" | "prestataire" | "talent", id: string) {
    setPending(id);
    try {
      await validerCompte(type, id);
      refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-xl font-semibold text-neutre-900">Gestion des comptes — Fiches du portefeuille</h1>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">Partenaires</h2>
        <div className="mt-2 space-y-2">
          {comptes.partenaires.map((p) => (
            <CompteRow
              key={p.id}
              nom={p.raisonSociale}
              type="Partenaire"
              verifie={p.verifieKYB}
              onValider={() => handleValider("partenaire", p.id)}
              pending={pending === p.id}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">Prestataires</h2>
        <div className="mt-2 space-y-2">
          {comptes.prestataires.map((p) => (
            <CompteRow
              key={p.id}
              nom={p.raisonSociale}
              type="Prestataire"
              verifie={p.verifieKYB}
              onValider={() => handleValider("prestataire", p.id)}
              pending={pending === p.id}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">Talents</h2>
        <div className="mt-2 space-y-2">
          {comptes.talents.map((t) => (
            <CompteRow
              key={t.id}
              nom={`${t.prenoms} ${t.nom}`}
              type="Talent"
              verifie={t.verifie}
              onValider={() => handleValider("talent", t.id)}
              pending={pending === t.id}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CompteRow({
  nom,
  type,
  verifie,
  onValider,
  pending,
}: {
  nom: string;
  type: string;
  verifie: boolean;
  onValider: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-neutre-200 bg-surface px-3 py-2 text-sm">
      <div>
        <span className="text-neutre-900">{nom}</span>
        <span className="ml-2 text-xs text-neutre-600">{type}</span>
      </div>
      {verifie ? (
        <span className="text-xs font-medium text-vert-benovare">Conforme</span>
      ) : (
        <button
          onClick={onValider}
          disabled={pending}
          className="rounded-md bg-vert-benovare px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Valider le KYC/KYB
        </button>
      )}
    </div>
  );
}
