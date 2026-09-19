"use client";

import { useEffect, useState } from "react";
import {
  lancerCollecte,
  listerVeilleAdmin,
  modererVeille,
  type CollecteResult,
  type OpportuniteExterne,
} from "@/lib/veille-api";

const STATUT_LABELS: Record<OpportuniteExterne["statutModeration"], string> = {
  EN_ATTENTE: "À modérer",
  APPROUVEE: "Approuvée",
  REJETEE: "Rejetée",
};

export default function CarrieresEtVeilleDuMarchePage() {
  const [tab, setTab] = useState<"EN_ATTENTE" | "APPROUVEE" | "REJETEE">("EN_ATTENTE");
  const [items, setItems] = useState<OpportuniteExterne[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [collecteResultats, setCollecteResultats] = useState<CollecteResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    listerVeilleAdmin(tab).then(setItems);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleModerer(id: string, decision: "APPROUVEE" | "REJETEE") {
    setPending(id);
    try {
      await modererVeille(id, decision);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setPending(null);
    }
  }

  async function handleCollecter() {
    setCollecting(true);
    setError(null);
    setCollecteResultats(null);
    try {
      const { resultats } = await lancerCollecte();
      setCollecteResultats(resultats);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setCollecting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">Carrières et veille du marché</h1>
        <p className="mt-1 text-sm text-neutre-600">
          Sources publiques suivies : NGO Jobs in Africa, BrighterMonday Kenya, Jobberman
          Nigeria. Modération des annonces
          avant leur publication dans l&apos;espace « Veille des opportunités du marché » des
          consoles Talents et Prestataires.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleCollecter}
          disabled={collecting}
          className="rounded-md bg-vert-benovare px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {collecting ? "Collecte en cours…" : "Lancer la collecte maintenant"}
        </button>
        <p className="text-xs text-neutre-600">
          Une collecte automatique périodique peut aussi être programmée en externe (cron-job.org)
          contre POST /api/veille/collecter.
        </p>
      </div>

      {collecteResultats && (
        <div className="rounded-lg border border-neutre-200 bg-surface p-4 text-sm">
          {collecteResultats.map((r) => (
            <p key={r.source} className="text-neutre-600">
              <span className="font-medium text-neutre-900">{r.source}</span> —{" "}
              {r.erreur ? `échec : ${r.erreur}` : `${r.nouvelles} nouvelle(s) sur ${r.trouvees} annonce(s)`}
            </p>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-orange-fonce">{error}</p>}

      <div className="flex gap-2 border-b border-neutre-200">
        {(["EN_ATTENTE", "APPROUVEE", "REJETEE"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t ? "border-b-2 border-vert-benovare text-neutre-900" : "text-neutre-600"
            }`}
          >
            {STATUT_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items === null && <p className="text-sm text-neutre-600">Chargement…</p>}
        {items?.length === 0 && <p className="text-sm text-neutre-600">Aucune annonce dans cette catégorie.</p>}
        {items?.map((item) => (
          <div key={item.id} className="rounded-lg border border-neutre-200 bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-neutre-900">{item.titre}</p>
                <p className="mt-1 text-xs text-neutre-600">
                  {item.source} ·{" "}
                  <a href={item.url} target="_blank" rel="noreferrer" className="underline">
                    Voir l&apos;annonce d&apos;origine
                  </a>
                </p>
              </div>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-neutre-600">{item.description}</p>
            {tab === "EN_ATTENTE" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleModerer(item.id, "APPROUVEE")}
                  disabled={pending === item.id}
                  className="rounded-md bg-vert-benovare px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  Approuver
                </button>
                <button
                  onClick={() => handleModerer(item.id, "REJETEE")}
                  disabled={pending === item.id}
                  className="rounded-md border border-neutre-200 px-3 py-1.5 text-sm font-medium text-neutre-900 hover:bg-neutre-50 disabled:opacity-50"
                >
                  Rejeter
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
