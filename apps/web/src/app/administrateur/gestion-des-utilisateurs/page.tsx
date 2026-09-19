"use client";

import { useEffect, useState } from "react";
import {
  assignerGestionnaire,
  changerStatut,
  listerGestionnaires,
  listerPartenairesPourAffectation,
  listerUtilisateurs,
  type AdminGestionnaire,
  type AdminPartenaireCompany,
  type AdminUser,
} from "@/lib/administrateur-api";

const STATUT_LABELS: Record<AdminUser["status"], string> = {
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
  EN_ATTENTE_VALIDATION: "En attente",
};

function nomCompte(u: AdminUser): string {
  if (u.talentProfile) return `${u.talentProfile.prenoms} ${u.talentProfile.nom}`;
  if (u.partenaireMember) return u.partenaireMember.company.raisonSociale;
  if (u.prestataireMember) return u.prestataireMember.company.raisonSociale;
  return u.email;
}

export default function GestionDesUtilisateursPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [gestionnaires, setGestionnaires] = useState<AdminGestionnaire[]>([]);
  const [partenaires, setPartenaires] = useState<AdminPartenaireCompany[] | null>(null);
  const [tab, setTab] = useState<"COMPTES" | "PORTEFEUILLES">("COMPTES");
  const [pending, setPending] = useState<string | null>(null);

  function refresh() {
    listerUtilisateurs().then(setUsers);
    listerGestionnaires().then(setGestionnaires);
    listerPartenairesPourAffectation().then(setPartenaires);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleStatut(userId: string, status: "ACTIF" | "SUSPENDU") {
    setPending(userId);
    try {
      await changerStatut(userId, status);
      refresh();
    } finally {
      setPending(null);
    }
  }

  async function handleAssigner(partenaireId: string, gestionnaireId: string) {
    setPending(partenaireId);
    try {
      await assignerGestionnaire(partenaireId, gestionnaireId || null);
      refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutre-900">Gestion des utilisateurs</h1>

      <div className="mt-4 flex gap-2 border-b border-neutre-200">
        {(["COMPTES", "PORTEFEUILLES"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t ? "border-b-2 border-vert-benovare text-neutre-900" : "text-neutre-600"
            }`}
          >
            {t === "COMPTES" ? "Tous les comptes" : "Attribution des portefeuilles"}
          </button>
        ))}
      </div>

      {tab === "COMPTES" && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutre-200 text-left text-xs uppercase tracking-wide text-neutre-600">
                <th className="py-2 pr-3">Compte</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Statut</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-neutre-100">
                  <td className="py-2 pr-3 text-neutre-900">{nomCompte(u)}</td>
                  <td className="py-2 pr-3 text-neutre-600">{u.role}</td>
                  <td className="py-2 pr-3 text-neutre-600">{STATUT_LABELS[u.status]}</td>
                  <td className="py-2 pr-3">
                    {u.status === "SUSPENDU" ? (
                      <button
                        onClick={() => handleStatut(u.id, "ACTIF")}
                        disabled={pending === u.id}
                        className="rounded-md bg-vert-benovare px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                      >
                        Réactiver
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatut(u.id, "SUSPENDU")}
                        disabled={pending === u.id}
                        className="rounded-md border border-neutre-200 px-2.5 py-1 text-xs font-medium text-neutre-900 hover:bg-neutre-50 disabled:opacity-50"
                      >
                        Suspendre
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users === null && <p className="mt-3 text-sm text-neutre-600">Chargement…</p>}
        </div>
      )}

      {tab === "PORTEFEUILLES" && (
        <div className="mt-4 space-y-2">
          {partenaires === null && <p className="text-sm text-neutre-600">Chargement…</p>}
          {partenaires?.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border border-neutre-200 bg-surface px-3 py-2 text-sm"
            >
              <div>
                <span className="text-neutre-900">{p.raisonSociale}</span>
                <span className="ml-2 text-xs text-neutre-600">
                  {p.gestionnaireCompte ? `— ${p.gestionnaireCompte.nom}` : "— sans gestionnaire assigné"}
                </span>
              </div>
              <select
                value={p.gestionnaireCompte?.id ?? ""}
                onChange={(e) => handleAssigner(p.id, e.target.value)}
                disabled={pending === p.id}
                className="rounded-md border border-neutre-200 px-2 py-1 text-xs"
              >
                <option value="">Non assigné</option>
                {gestionnaires.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nom}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
