"use client";

import { useEffect, useState } from "react";
import {
  confirmerVirement,
  creerDevis,
  listerCiblesDevis,
  listerTousLesDevis,
  type CibleDevis,
  type Devis,
  type TargetType,
} from "@/lib/devis-api";

const FORMULES: Record<TargetType, string[]> = {
  TALENT: ["SILVER", "GOLD", "PLATINUM"],
  PRESTATAIRE: ["SILVER", "GOLD", "PLATINUM"],
  PARTENAIRE: ["ESSENTIEL", "BUSINESS", "ENTERPRISE"],
};

function nomCible(c: CibleDevis) {
  if (c.raisonSociale) return c.raisonSociale;
  return `${c.prenoms ?? ""} ${c.nom ?? ""}`.trim();
}

function nomDevis(d: Devis) {
  if (d.talentProfile) return `${d.talentProfile.prenoms} ${d.talentProfile.nom} (Talent)`;
  if (d.prestataireCompany) return `${d.prestataireCompany.raisonSociale} (Prestataire)`;
  if (d.partenaireCompany) return `${d.partenaireCompany.raisonSociale} (Partenaire)`;
  return "—";
}

export default function AbonnementsEtTarificationPage() {
  const [targetType, setTargetType] = useState<TargetType>("TALENT");
  const [cibles, setCibles] = useState<CibleDevis[]>([]);
  const [targetId, setTargetId] = useState("");
  const [formule, setFormule] = useState(FORMULES.TALENT[0]);
  const [montant, setMontant] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [devis, setDevis] = useState<Devis[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  function refreshDevis() {
    listerTousLesDevis().then(setDevis);
  }

  useEffect(() => {
    refreshDevis();
  }, []);

  useEffect(() => {
    setFormule(FORMULES[targetType][0]);
    setTargetId("");
    listerCiblesDevis(targetType).then(setCibles);
  }, [targetType]);

  async function handleCreer(e: React.FormEvent) {
    e.preventDefault();
    if (!targetId || !montant) return;
    setCreating(true);
    setError(null);
    try {
      await creerDevis({ targetType, targetId, formule, montant: Number(montant) });
      setMontant("");
      setTargetId("");
      refreshDevis();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la création du devis");
    } finally {
      setCreating(false);
    }
  }

  async function handleConfirmerVirement(id: string) {
    setConfirming(id);
    try {
      await confirmerVirement(id);
      refreshDevis();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la confirmation du virement");
    } finally {
      setConfirming(null);
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutre-900">Abonnements et tarification</h1>
        <p className="mt-1 text-sm text-neutre-600">
          Chaque formule est établie au cas par cas sous forme de devis. Une fois le paiement reçu
          (KKiaPay, FedaPay, ou virement confirmé manuellement ici), un code d&apos;activation est
          envoyé automatiquement par e-mail au compte concerné.
        </p>
      </div>

      <section className="rounded-xl border border-neutre-200 bg-surface p-5">
        <h2 className="font-semibold text-neutre-900">Créer un devis</h2>
        {error && <p className="mt-2 text-sm text-orange-fonce">{error}</p>}
        <form onSubmit={handleCreer} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as TargetType)}
            className="rounded-md border border-neutre-300 px-3 py-2 text-sm"
          >
            <option value="TALENT">Talent</option>
            <option value="PRESTATAIRE">Prestataire</option>
            <option value="PARTENAIRE">Partenaire</option>
          </select>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="rounded-md border border-neutre-300 px-3 py-2 text-sm"
          >
            <option value="">— Sélectionner —</option>
            {cibles.map((c) => (
              <option key={c.id} value={c.id}>
                {nomCible(c)}
              </option>
            ))}
          </select>
          <select
            value={formule}
            onChange={(e) => setFormule(e.target.value)}
            className="rounded-md border border-neutre-300 px-3 py-2 text-sm"
          >
            {FORMULES[targetType].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="Montant (XOF)"
            className="rounded-md border border-neutre-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={creating || !targetId || !montant}
            className="rounded-md bg-vert-benovare px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 sm:col-span-2"
          >
            {creating ? "…" : "Créer le devis"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">Devis</h2>
        <div className="mt-2 space-y-2">
          {devis?.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutre-200 bg-surface px-3 py-2 text-sm"
            >
              <div>
                <span className="text-neutre-900">{nomDevis(d)}</span>
                <span className="ml-2 text-xs text-neutre-600">
                  {d.formule} — {d.montant.toLocaleString("fr-FR")} {d.devise}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    d.statut === "PAYE"
                      ? "bg-vert-benovare/10 text-vert-benovare"
                      : "bg-neutre-100 text-neutre-600"
                  }`}
                >
                  {d.statut === "PAYE" ? "Payé" : d.statut === "ANNULE" ? "Annulé" : "En attente"}
                </span>
                {d.statut === "EN_ATTENTE" && d.moyenPaiement === "VIREMENT_BANCAIRE" && (
                  <button
                    onClick={() => handleConfirmerVirement(d.id)}
                    disabled={confirming === d.id}
                    className="rounded-md bg-vert-benovare px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Confirmer le virement reçu
                  </button>
                )}
              </div>
            </div>
          ))}
          {devis?.length === 0 && <p className="text-sm text-neutre-600">Aucun devis pour le moment.</p>}
        </div>
      </section>
    </div>
  );
}
