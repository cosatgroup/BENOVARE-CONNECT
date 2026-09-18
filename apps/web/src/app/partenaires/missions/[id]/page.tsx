"use client";

import { use, useEffect, useState } from "react";
import {
  decisionDemande,
  envoyerMessage,
  getMission,
  type Mission,
} from "@/lib/partenaires-api";

const JALON_LABELS: Record<string, string> = {
  A_VENIR: "À venir",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
};

export default function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mission, setMission] = useState<Mission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingDemandeId, setPendingDemandeId] = useState<string | null>(null);

  function refresh() {
    getMission(id)
      .then(setMission)
      .catch((err) => setError(err instanceof Error ? err.message : "Une erreur est survenue"));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <p className="text-sm text-orange-fonce">{error}</p>;
  if (!mission) return null;

  async function handleDemandeDecision(demandeId: string, decision: "VALIDEE" | "REFUSEE") {
    setPendingDemandeId(demandeId);
    try {
      await decisionDemande(id, demandeId, decision);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setPendingDemandeId(null);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim()) return;
    setSending(true);
    try {
      await envoyerMessage(id, messageInput);
      setMessageInput("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSending(false);
    }
  }

  const demandesEnAttente = mission.demandes?.filter((d) => d.statut === "EN_ATTENTE") ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">{mission.besoin.titre}</h1>
        <p className="text-sm text-neutre-600">{mission.besoin.description}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">Jalons</h2>
        <div className="mt-2 flex gap-3 overflow-x-auto">
          {mission.jalons.map((j) => (
            <div
              key={j.id}
              className={`min-w-[140px] rounded-lg border p-3 text-sm ${
                j.statut === "TERMINE"
                  ? "border-vert-benovare bg-neutre-50"
                  : "border-neutre-200"
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

      {demandesEnAttente.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
            Demandes en attente
          </h2>
          <div className="mt-2 space-y-3">
            {demandesEnAttente.map((d) => (
              <div key={d.id} className="rounded-lg border border-neutre-200 bg-surface p-4">
                <p className="font-medium text-neutre-900">
                  {d.type === "DELAI" ? "Demande de délai" : "Demande d'avenant"}
                  {d.dureeJours ? ` — ${d.dureeJours} jours` : ""}
                </p>
                <p className="mt-1 text-sm text-neutre-600">{d.motif}</p>
                <p className="mt-1 text-xs text-neutre-600">
                  {d.declarationAnticipee
                    ? "Signalée avant l'échéance du jalon."
                    : "Signalée après l'échéance du jalon."}{" "}
                  Examinée conjointement par Benovare et vous-même avant décision.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleDemandeDecision(d.id, "VALIDEE")}
                    disabled={pendingDemandeId === d.id}
                    className="rounded-md bg-vert-benovare px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Valider la demande
                  </button>
                  <button
                    onClick={() => handleDemandeDecision(d.id, "REFUSEE")}
                    disabled={pendingDemandeId === d.id}
                    className="rounded-md border border-neutre-200 px-3 py-1.5 text-sm font-medium text-neutre-900 hover:bg-neutre-50 disabled:opacity-50"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Livrables déposés
        </h2>
        <div className="mt-2 space-y-2">
          {mission.livrables?.length ? (
            mission.livrables.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-md border border-neutre-200 bg-surface px-3 py-2 text-sm"
              >
                <span className="text-neutre-900">{l.nom}</span>
                <span className="text-xs text-neutre-600">
                  {new Date(l.deposeLe).toLocaleDateString("fr-FR")} · {l.valide ? "Validé" : "En attente"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutre-600">Aucun livrable déposé pour l&apos;instant.</p>
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
