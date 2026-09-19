"use client";

import { useEffect, useState } from "react";
import {
  listerPipeline,
  transmettrePremierEntretien,
  type PipelineCandidature,
} from "@/lib/gestionnaire-api";

const STATUT_LABELS: Record<PipelineCandidature["statut"], string> = {
  SOUMISE: "Soumise",
  PRESELECTIONNEE: "Présélectionnée",
  ENTRETIEN_PLANIFIE: "Entretien planifié",
  ENTRETIEN_FINAL: "Transmise au Partenaire",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
};

function nomCandidat(c: PipelineCandidature): string {
  if (c.talent) return `${c.talent.prenoms} ${c.talent.nom}`;
  if (c.prestataireCompany) return c.prestataireCompany.raisonSociale;
  return "Candidat";
}

export default function SourcingEtSelectionPage() {
  const [pipeline, setPipeline] = useState<PipelineCandidature[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [compteRendu, setCompteRendu] = useState("");
  const [pending, setPending] = useState(false);

  function refresh() {
    listerPipeline()
      .then(setPipeline)
      .catch((err) => setError(err instanceof Error ? err.message : "Une erreur est survenue"));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleEntretien(id: string, resultat: "FAVORABLE" | "DEFAVORABLE") {
    if (!compteRendu.trim()) {
      setError("Le compte-rendu est requis.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await transmettrePremierEntretien(id, resultat, compteRendu);
      setOpenId(null);
      setCompteRendu("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutre-900">Pipeline des candidatures</h1>
      <p className="mt-1 text-sm text-neutre-600">
        Premier entretien planifié et conduit par vous, puis organisation de l&apos;entretien final
        du Partenaire.
      </p>

      {error && <p className="mt-3 text-sm text-orange-fonce">{error}</p>}

      <div className="mt-4 space-y-3">
        {pipeline === null && <p className="text-sm text-neutre-600">Chargement…</p>}
        {pipeline?.length === 0 && <p className="text-sm text-neutre-600">Aucune candidature en attente.</p>}

        {pipeline?.map((c) => (
          <div key={c.id} className="rounded-lg border border-neutre-200 bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-neutre-900">{nomCandidat(c)}</p>
                <p className="text-sm text-neutre-600">
                  {c.besoin.titre} — {c.besoin.partenaireCompany?.raisonSociale}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-neutre-100 px-2.5 py-1 text-xs font-medium text-neutre-900">
                {STATUT_LABELS[c.statut]}
              </span>
            </div>

            {(c.statut === "SOUMISE" || c.statut === "PRESELECTIONNEE") && (
              <div className="mt-3">
                {openId === c.id ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-neutre-600">
                      Grille d&apos;évaluation
                    </p>
                    <textarea
                      value={compteRendu}
                      onChange={(e) => setCompteRendu(e.target.value)}
                      placeholder="Compétence technique, conformité administrative, disponibilité, message motivé…"
                      rows={3}
                      className="w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEntretien(c.id, "FAVORABLE")}
                        disabled={pending}
                        className="rounded-md bg-vert-benovare px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                      >
                        Transmettre au Partenaire
                      </button>
                      <button
                        onClick={() => handleEntretien(c.id, "DEFAVORABLE")}
                        disabled={pending}
                        className="rounded-md border border-neutre-200 px-3 py-1.5 text-sm font-medium text-neutre-900 hover:bg-neutre-50 disabled:opacity-50"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setOpenId(c.id)}
                    className="text-sm font-medium text-vert-benovare"
                  >
                    Mener le premier entretien
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-neutre-200 bg-surface p-4 text-sm text-neutre-600">
        <p className="font-medium text-neutre-900">Agenda partagé</p>
        <p className="mt-1">
          Le premier entretien est planifié directement sur l&apos;agenda partagé avec le candidat.
          L&apos;entretien final, conduit par le Partenaire, peut y associer un représentant de
          l&apos;entreprise cliente.
        </p>
      </div>
    </div>
  );
}
