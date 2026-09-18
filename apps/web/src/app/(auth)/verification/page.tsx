"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MfaChallenge } from "@/lib/api";
import { verifyMfa } from "@/lib/api";
import { consoles, type Role } from "@/lib/consoles";

export default function VerificationPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Part de `null` pour un rendu initial identique serveur/client — lire
  // sessionStorage doit attendre l'effet, sous peine d'erreur d'hydratation
  // (le serveur n'a pas de window, donc rendrait un contenu différent).
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("mfaChallenge");
    const parsed = raw ? (JSON.parse(raw) as MfaChallenge) : null;
    // Lecture d'un système externe (sessionStorage) au montage — le
    // setState qui suit n'est pas une boucle de rendu React->React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChallenge(parsed);
    setChecked(true);
    if (!parsed) {
      router.replace("/connexion");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setError(null);
    setLoading(true);
    try {
      const { token, role } = await verifyMfa(challenge.pendingMfaToken, code);
      localStorage.setItem("authToken", token);
      sessionStorage.removeItem("mfaChallenge");
      const destination = consoles[role as Role]?.basePath ?? "/connexion";
      router.push(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (!checked || !challenge) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-lg font-semibold text-neutre-900">Vérification en deux étapes</h1>

      {challenge.needsSetup ? (
        <div className="space-y-3">
          <p className="text-sm text-neutre-600">
            Scannez ce QR code avec votre application d&apos;authentification (Google
            Authenticator, Authy, 1Password…), puis saisissez le code à 6 chiffres qu&apos;elle
            affiche.
          </p>
          {challenge.qrCodeDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={challenge.qrCodeDataUrl}
              alt="QR code de configuration MFA"
              className="mx-auto h-40 w-40"
            />
          )}
          {challenge.manualKey && (
            <p className="text-center text-xs text-neutre-600">
              Ou saisissez cette clé manuellement :{" "}
              <span className="font-mono tracking-wider">{challenge.manualKey}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-neutre-600">
          Saisissez le code à 6 chiffres affiché par votre application d&apos;authentification.
        </p>
      )}

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
