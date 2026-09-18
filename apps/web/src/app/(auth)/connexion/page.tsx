"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { pendingMfaToken } = await login(email, password);
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
      <h1 className="text-lg font-semibold text-neutre-900">Connexion</h1>

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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-orange-fonce">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-vert-benovare px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center text-sm text-neutre-600">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-vert-benovare font-medium">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
