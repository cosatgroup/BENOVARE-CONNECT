"use client";

import { use, useEffect, useState } from "react";
import {
  declarerImprevu,
  envoyerMessageMission,
  getMaMission,
  type TalentMission,
} from "@/lib/talents-api";

const JALON_LABELS: Record<string, string> = {
  A_VENIR: "À venir",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
};

export default function PilotageMissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mission, setMission] = useState<TalentMission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showImprevu, setShowImprevu] = useState(false);
  const [motif, setMotif] = useState("");
  const [dureeJours, setDureeJours] = useState("");

  function refresh() {
    getMaMission(id)
      .then(setMission)
      .catch((err) => setError(err instanceof Error ? err.message : "Une erreur est survenue"));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <p className="text-sm text-orange-fonce">{error}</p>;
  if (!mission) return null;

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim()) return;
    setSending(true);
    try {
      await envoyerMessageMission(id, messageInput);
      setMessageInput("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSending(false);
    }
  }

  async function handleDeclarerImprevu(e: React.FormEvent) {
    e.preventDefault();
    if (!motif.trim()) return;
    try {
      await declarerImprevu(id, "DELAI", motif, dureeJours ? Number(dureeJours) : undefined);
      setMotif("");
      setDureeJours("");
      setShowImprevu(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">{mission.besoin.titre}</h1>
        <p className="text-sm text-neutre-600">{mission.besoin.partenaireCompany?.raisonSociale}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">Jalons</h2>
        <div className="mt-2 flex gap-3 overflow-x-auto">
          {mission.jalons.map((j) => (
            <div
              key={j.id}
              className={`min-w-[140px] rounded-lg border p-3 text-sm ${
                j.statut === "TERMINE" ? "border-vert-benovare bg-neutre-50" : "border-neutre-200"
              }`}
            >
              <p className="font-medium text-neutre-900">{j.nom}</p>
              <p className="mt-1 text-xs text-neutre-600">{JALON_LABELS[j.statut]}</p>
            </div>
          ))}
          {mission.jalons.length === 0 && (
            <p className="text-sm text-neutre-600">Aucun jalon défini pour l&apos;instant.</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
            Demandes de délai / avenant
          </h2>
          <button
            onClick={() => setShowImprevu((v) => !v)}
            className="text-sm font-medium text-vert-benovare"
          >
            Déclarer un imprévu
          </button>
        </div>

        {showImprevu && (
          <form onSubmit={handleDeclarerImprevu} className="mt-3 space-y-2 rounded-lg border border-neutre-200 bg-surface p-4">
            <textarea
              required
              placeholder="Décrivez l'imprévu ou la complication…"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
              rows={3}
            />
            <input
              type="number"
              placeholder="Nombre de jours de délai supplémentaire"
              value={dureeJours}
              onChange={(e) => setDureeJours(e.target.value)}
              className="w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-vert-benovare px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Envoyer la demande
            </button>
          </form>
        )}

        <div className="mt-3 space-y-2">
          {mission.demandes?.length ? (
            mission.demandes.map((d) => (
              <div key={d.id} className="rounded-md border border-neutre-200 bg-surface px-3 py-2 text-sm">
                <p className="text-neutre-900">{d.motif}</p>
                <p className="mt-1 text-xs text-neutre-600">
                  {d.statut === "EN_ATTENTE"
                    ? "Examinée conjointement par Benovare et le Partenaire."
                    : d.statut === "VALIDEE"
                      ? "Validée"
                      : "Refusée"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutre-600">Aucune demande en cours.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Messagerie de la mission
        </h2>
        <div className="mt-2 space-y-2 rounded-lg border border-neutre-200 bg-surface p-4">
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {mission.messages?.length ? (
              mission.messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <p className="font-medium text-neutre-900">
                    {m.author.email} <span className="font-normal text-neutre-600">· {m.author.role}</span>
                  </p>
                  <p className="text-neutre-600">{m.contenu}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutre-600">Aucun message pour l&apos;instant.</p>
            )}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Écrire un message…"
              className="flex-1 rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-md bg-vert-benovare px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
