"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerAccount } from "@/lib/api";

const ROLES = [
  { value: "TALENT", label: "Talent — professionnel individuel" },
  { value: "PRESTATAIRE", label: "Prestataire — société de services" },
  { value: "PARTENAIRE", label: "Partenaire — entreprise cliente" },
] as const;

export default function InscriptionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("TALENT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { pendingMfaToken } = await registerAccount({ email, password, role });
      sessionStorage.setItem("pendingMfaToken", pendingMfaToken);
      router.push("/verification");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-lg font-semibold text-neutre-900">Créer un compte</h1>

      <div>
        <label className="block text-sm font-medium text-neutre-900">Vous êtes</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
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
        <label className="block text-sm font-medium text-neutre-900">Mot de passe</label>
        <input
          type="password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-neutre-600">10 caractères minimum.</p>
      </div>

      {error && <p className="text-sm text-orange-fonce">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-vert-benovare px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Création…" : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-neutre-600">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="text-vert-benovare font-medium">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
