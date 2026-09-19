"use client";

import { useEffect, useState } from "react";
import {
  lancerCollecte,
  listerVeilleAdmin,
  modererVeille,
  type CollecteResult,
  type OpportuniteExterne,
} from "@/lib/veille-api";
import { creerPlacement, listerPlacements, type Placement } from "@/lib/placements-api";

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

  const [placements, setPlacements] = useState<Placement[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [placementType, setPlacementType] = useState<"RECRUTEMENT_TALENT" | "RECRUTEMENT_PRESTATAIRE">(
    "RECRUTEMENT_TALENT"
  );
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [entrepriseClienteNom, setEntrepriseClienteNom] = useState("");
  const [niveauEtoiles, setNiveauEtoiles] = useState(2);
  const [creatingPlacement, setCreatingPlacement] = useState(false);
  const [placementError, setPlacementError] = useState<string | null>(null);

  function refresh() {
    listerVeilleAdmin(tab).then(setItems);
  }

  function refreshPlacements() {
    listerPlacements().then(setPlacements);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    refreshPlacements();
  }, []);

  async function handleCreerPlacement(e: React.FormEvent) {
    e.preventDefault();
    setPlacementError(null);
    setCreatingPlacement(true);
    try {
      await creerPlacement({ type: placementType, titre, description, niveauEtoiles, entrepriseClienteNom });
      setTitre("");
      setDescription("");
      setEntrepriseClienteNom("");
      setShowForm(false);
      refreshPlacements();
    } catch (err) {
      setPlacementError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setCreatingPlacement(false);
    }
  }

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
          avant leur publication dans l&apos;espace « Veille des opportunités du marché » de la
          console Talents.
        </p>
      </div>

      <section className="space-y-3 border-b border-neutre-200 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
            Offres de placement Benovare
          </h2>
          <button onClick={() => setShowForm((v) => !v)} className="text-sm font-medium text-vert-benovare">
            {showForm ? "Annuler" : "Publier une offre"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreerPlacement} className="space-y-3 rounded-lg border border-neutre-200 bg-surface p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutre-900">Type</label>
                <select
                  value={placementType}
                  onChange={(e) => setPlacementType(e.target.value as typeof placementType)}
                  className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
                >
                  <option value="RECRUTEMENT_TALENT">Recrutement de talent</option>
                  <option value="RECRUTEMENT_PRESTATAIRE">Recrutement de prestataire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutre-900">Entreprise cliente</label>
                <input
                  required
                  value={entrepriseClienteNom}
                  onChange={(e) => setEntrepriseClienteNom(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutre-900">Titre</label>
              <input
                required
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutre-900">Description</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutre-900">
                Niveau d&apos;exigence ({niveauEtoiles}/4)
              </label>
              <input
                type="range"
                min={1}
                max={4}
                value={niveauEtoiles}
                onChange={(e) => setNiveauEtoiles(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
            {placementError && <p className="text-sm text-orange-fonce">{placementError}</p>}
            <button
              type="submit"
              disabled={creatingPlacement}
              className="rounded-md bg-vert-benovare px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {creatingPlacement ? "Publication…" : "Publier l'offre"}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {placements === null && <p className="text-sm text-neutre-600">Chargement…</p>}
          {placements?.length === 0 && <p className="text-sm text-neutre-600">Aucune offre publiée.</p>}
          {placements?.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border border-neutre-200 bg-surface px-3 py-2 text-sm"
            >
              <div>
                <span className="text-neutre-900">{p.titre}</span>
                <span className="ml-2 text-xs text-neutre-600">
                  {p.entrepriseClienteNom} · {p.type === "RECRUTEMENT_TALENT" ? "Talent" : "Prestataire"}
                </span>
              </div>
              <span className="text-xs text-neutre-600">
                {p._count?.candidatures ?? 0} candidature(s) · {p.statut}
              </span>
            </div>
          ))}
        </div>
      </section>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
        Veille des opportunités du marché
      </h2>

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
