"use client";

import { useEffect, useState } from "react";
import { definirMerite, listerCandidatsMerite, type MeriteCandidats } from "@/lib/administrateur-api";

export default function MeriteEtProfilUnicornPage() {
  const [candidats, setCandidats] = useState<MeriteCandidats | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  function refresh() {
    listerCandidatsMerite().then(setCandidats);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!candidats) return null;

  async function toggle(
    type: "talent" | "prestataire",
    id: string,
    field: "badgeMerite" | "profilUnicorn",
    current: boolean
  ) {
    setPending(id + field);
    try {
      await definirMerite(type, id, { [field]: !current });
      refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">Programme de mérite & Profil Unicorn</h1>
        <p className="mt-1 text-sm text-neutre-600">
          Validation finale des statuts — dernière étape avant l&apos;attribution effective du
          badge ou du statut Unicorn.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">Talents</h2>
        <div className="mt-2 space-y-2">
          {candidats.talents.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-md border border-neutre-200 bg-surface px-3 py-2 text-sm">
              <div>
                <span className="text-neutre-900">{t.prenoms} {t.nom}</span>
                <span className="ml-2 text-xs text-neutre-600">Trust Score {t.trustScore}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggle("talent", t.id, "badgeMerite", t.badgeMerite)}
                  disabled={pending === t.id + "badgeMerite"}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    t.badgeMerite ? "bg-vert-benovare text-white" : "border border-neutre-200 text-neutre-900"
                  } disabled:opacity-50`}
                >
                  Badge de mérite
                </button>
                <button
                  onClick={() => toggle("talent", t.id, "profilUnicorn", t.profilUnicorn)}
                  disabled={pending === t.id + "profilUnicorn"}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    t.profilUnicorn ? "bg-orange-connect text-white" : "border border-neutre-200 text-neutre-900"
                  } disabled:opacity-50`}
                >
                  Profil Unicorn
                </button>
              </div>
            </div>
          ))}
          {candidats.talents.length === 0 && <p className="text-sm text-neutre-600">Aucun Talent.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">Prestataires</h2>
        <div className="mt-2 space-y-2">
          {candidats.prestataires.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-neutre-200 bg-surface px-3 py-2 text-sm">
              <div>
                <span className="text-neutre-900">{p.raisonSociale}</span>
                <span className="ml-2 text-xs text-neutre-600">Trust Score {p.trustScore}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggle("prestataire", p.id, "badgeMerite", p.badgeMerite)}
                  disabled={pending === p.id + "badgeMerite"}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    p.badgeMerite ? "bg-vert-benovare text-white" : "border border-neutre-200 text-neutre-900"
                  } disabled:opacity-50`}
                >
                  Badge de mérite
                </button>
                <button
                  onClick={() => toggle("prestataire", p.id, "profilUnicorn", p.profilUnicorn)}
                  disabled={pending === p.id + "profilUnicorn"}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    p.profilUnicorn ? "bg-orange-connect text-white" : "border border-neutre-200 text-neutre-900"
                  } disabled:opacity-50`}
                >
                  Profil Unicorn
                </button>
              </div>
            </div>
          ))}
          {candidats.prestataires.length === 0 && <p className="text-sm text-neutre-600">Aucun Prestataire.</p>}
        </div>
      </section>
    </div>
  );
}
