"use client";

import { useEffect, useState } from "react";
import {
  assignerGestionnaire,
  changerStatut,
  creerCompteInterne,
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
  const [tab, setTab] = useState<"COMPTES" | "PORTEFEUILLES" | "INTERNE">("COMPTES");
  const [pending, setPending] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"GESTIONNAIRE" | "ADMINISTRATEUR">("GESTIONNAIRE");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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

  async function handleCreerCompteInterne(e: React.FormEvent) {
    e.preventDefault();
    setCreationError(null);
    setCreationSuccess(null);
    setCreating(true);
    try {
      await creerCompteInterne({ email, password, role, nom });
      setCreationSuccess(
        `Compte ${role === "GESTIONNAIRE" ? "Gestionnaire" : "Administrateur"} créé pour ${email}. Communiquez-lui le mot de passe de façon sécurisée — la configuration MFA se fera à sa première connexion.`
      );
      setNom("");
      setEmail("");
      setPassword("");
      refresh();
    } catch (err) {
      setCreationError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutre-900">Gestion des utilisateurs</h1>

      <div className="mt-4 flex gap-2 border-b border-neutre-200">
        {(["COMPTES", "PORTEFEUILLES", "INTERNE"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t ? "border-b-2 border-vert-benovare text-neutre-900" : "text-neutre-600"
            }`}
          >
            {t === "COMPTES"
              ? "Tous les comptes"
              : t === "PORTEFEUILLES"
                ? "Attribution des portefeuilles"
                : "Créer un compte interne"}
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

      {tab === "INTERNE" && (
        <form onSubmit={handleCreerCompteInterne} className="mt-4 max-w-sm space-y-4">
          <p className="text-sm text-neutre-600">
            Seul point de création des comptes internes (Gestionnaire de compte, Administrateur).
            La personne finalise elle-même sa configuration MFA à sa première connexion.
          </p>

          <div>
            <label className="block text-sm font-medium text-neutre-900">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            >
              <option value="GESTIONNAIRE">Gestionnaire de compte</option>
              <option value="ADMINISTRATEUR">Administrateur</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutre-900">Nom</label>
            <input
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutre-900">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutre-900">Mot de passe initial</label>
            <input
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
          </div>

          {creationError && <p className="text-sm text-orange-fonce">{creationError}</p>}
          {creationSuccess && <p className="text-sm text-vert-benovare">{creationSuccess}</p>}

          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-vert-benovare px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {creating ? "Création…" : "Créer le compte"}
          </button>
        </form>
      )}
    </div>
  );
}
