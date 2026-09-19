"use client";

import { useEffect, useState } from "react";
import {
  activerCodeLicence,
  confirmerKkiapay,
  getKkiapayConfig,
  listerMesDevis,
  payerParFedapay,
  payerParVirement,
  type Devis,
} from "@/lib/devis-api";

declare global {
  interface Window {
    openKkiapayWidget?: (options: Record<string, unknown>) => void;
    addKkiapaySuccessListener?: (cb: (response: { transactionId: string }) => void) => void;
    addKkiapayFailedListener?: (cb: () => void) => void;
    removeKkiapayListener?: (event: "success" | "failed") => void;
  }
}

const KKIAPAY_SCRIPT_URL = "https://cdn.kkiapay.me/k.js";

function chargerScriptKkiapay(): Promise<void> {
  if (document.querySelector(`script[src="${KKIAPAY_SCRIPT_URL}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = KKIAPAY_SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Impossible de charger le module de paiement KKiaPay"));
    document.body.appendChild(script);
  });
}

function formatMontant(montant: number, devise: string) {
  return `${montant.toLocaleString("fr-FR")} ${devise}`;
}

export function GestionDevisEtLicence({ onActivated }: { onActivated?: () => void }) {
  const [devis, setDevis] = useState<Devis[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paiementEnCours, setPaiementEnCours] = useState<string | null>(null);
  const [instructionsVirement, setInstructionsVirement] = useState<{ devisId: string; texte: string } | null>(null);

  const [code, setCode] = useState("");
  const [activation, setActivation] = useState<string | null>(null);
  const [activationEnCours, setActivationEnCours] = useState(false);

  async function charger() {
    try {
      setDevis(await listerMesDevis());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger vos devis");
    }
  }

  useEffect(() => {
    charger();
  }, []);

  async function payerKkiapay(d: Devis) {
    setError(null);
    setPaiementEnCours(d.id);
    try {
      const { publicKey, sandbox } = await getKkiapayConfig();
      await chargerScriptKkiapay();

      window.addKkiapaySuccessListener?.(async (response) => {
        try {
          await confirmerKkiapay(d.id, response.transactionId);
          await charger();
          onActivated?.();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Échec de la confirmation du paiement");
        } finally {
          setPaiementEnCours(null);
        }
      });
      window.addKkiapayFailedListener?.(() => setPaiementEnCours(null));

      window.openKkiapayWidget?.({
        amount: d.montant,
        api_key: publicKey,
        sandbox,
        data: d.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'initialisation du paiement KKiaPay");
      setPaiementEnCours(null);
    }
  }

  async function payerFedapay(d: Devis) {
    setError(null);
    setPaiementEnCours(d.id);
    try {
      const { url } = await payerParFedapay(d.id);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'initialisation du paiement FedaPay");
      setPaiementEnCours(null);
    }
  }

  async function payerVirement(d: Devis) {
    setError(null);
    setPaiementEnCours(d.id);
    try {
      const { instructions } = await payerParVirement(d.id);
      setInstructionsVirement({ devisId: d.id, texte: instructions });
      await charger();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la sélection du virement bancaire");
    } finally {
      setPaiementEnCours(null);
    }
  }

  async function handleActiver(e: React.FormEvent) {
    e.preventDefault();
    setActivation(null);
    setActivationEnCours(true);
    try {
      const result = await activerCodeLicence(code.trim());
      setActivation(`Formule ${result.formule} activée avec succès.`);
      setCode("");
      onActivated?.();
    } catch (err) {
      setActivation(err instanceof Error ? err.message : "Échec de l'activation du code");
    } finally {
      setActivationEnCours(false);
    }
  }

  const enAttente = devis?.filter((d) => d.statut === "EN_ATTENTE") ?? [];
  const historique = devis?.filter((d) => d.statut !== "EN_ATTENTE") ?? [];

  return (
    <div className="mt-8 space-y-6">
      {error && <p className="text-sm text-orange-fonce">{error}</p>}

      {enAttente.length > 0 && (
        <div className="rounded-xl border border-neutre-200 bg-surface p-5">
          <h2 className="font-semibold text-neutre-900">Devis en attente de paiement</h2>
          <p className="mt-1 text-sm text-neutre-600">
            Benovare vous a établi un devis pour cette formule. Réglez-le pour recevoir par e-mail votre
            code d&apos;activation.
          </p>
          <ul className="mt-4 space-y-3">
            {enAttente.map((d) => (
              <li key={d.id} className="rounded-lg border border-neutre-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-neutre-900">{d.formule}</p>
                    <p className="text-sm text-neutre-600">{formatMontant(d.montant, d.devise)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => payerKkiapay(d)}
                      disabled={paiementEnCours === d.id}
                      className="rounded-md bg-vert-benovare px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      Payer par Mobile Money (KKiaPay)
                    </button>
                    <button
                      onClick={() => payerFedapay(d)}
                      disabled={paiementEnCours === d.id}
                      className="rounded-md bg-vert-benovare px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      Payer par Mobile Money / Carte (FedaPay)
                    </button>
                    <button
                      onClick={() => payerVirement(d)}
                      disabled={paiementEnCours === d.id}
                      className="rounded-md border border-neutre-300 px-3 py-1.5 text-sm font-medium text-neutre-900 hover:bg-neutre-50 disabled:opacity-50"
                    >
                      Virement bancaire
                    </button>
                  </div>
                </div>
                {instructionsVirement?.devisId === d.id && (
                  <p className="mt-3 rounded-md bg-neutre-50 p-3 text-sm text-neutre-700">
                    {instructionsVirement.texte}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-neutre-200 bg-surface p-5">
        <h2 className="font-semibold text-neutre-900">Activer un code de licence</h2>
        <p className="mt-1 text-sm text-neutre-600">
          Une fois votre paiement confirmé, Benovare vous envoie un code par e-mail. Saisissez-le
          ci-dessous pour activer votre formule.
        </p>
        <form onSubmit={handleActiver} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="BNVR-XXXX-XXXX"
            className="rounded-md border border-neutre-300 px-3 py-2 text-sm uppercase tracking-wider"
          />
          <button
            type="submit"
            disabled={!code.trim() || activationEnCours}
            className="rounded-md bg-vert-benovare px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {activationEnCours ? "…" : "Activer"}
          </button>
        </form>
        {activation && <p className="mt-2 text-sm text-neutre-700">{activation}</p>}
      </div>

      {historique.length > 0 && (
        <div className="rounded-xl border border-neutre-200 bg-surface p-5">
          <h2 className="font-semibold text-neutre-900">Historique des devis</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {historique.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-neutre-700">
                <span>
                  {d.formule} — {formatMontant(d.montant, d.devise)}
                </span>
                <span className={d.statut === "PAYE" ? "text-vert-benovare" : "text-neutre-500"}>
                  {d.statut === "PAYE" ? "Payé" : "Annulé"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
