"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyMfa } from "@/lib/api";
import { consoles, type Role } from "@/lib/consoles";

export default function VerificationPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingMfaToken, setPendingMfaToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("pendingMfaToken");
    if (!token) {
      router.replace("/connexion");
      return;
    }
    setPendingMfaToken(token);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingMfaToken) return;
    setError(null);
    setLoading(true);
    try {
      const { token, role } = await verifyMfa(pendingMfaToken, code);
      localStorage.setItem("authToken", token);
      sessionStorage.removeItem("pendingMfaToken");
      const destination = consoles[role as Role]?.basePath ?? "/connexion";
      router.push(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-lg font-semibold text-neutre-900">Vérification en deux étapes</h1>
      <p className="text-sm text-neutre-600">
        Saisissez le code à 6 chiffres envoyé par e-mail, SMS ou votre application
        d&apos;authentification.
      </p>

      <div>
        <label className="block text-sm font-medium text-neutre-900">Code de vérification</label>
        <input
          type="text"
          inputMode="numeric"
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-center text-lg tracking-[0.5em]"
        />
      </div>

      {error && <p className="text-sm text-orange-fonce">{error}</p>}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full rounded-md bg-vert-benovare px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Vérification…" : "Valider"}
      </button>
    </form>
  );
}
