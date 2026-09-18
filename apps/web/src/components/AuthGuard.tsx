"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth-client";

// Garde-fou client minimal : redirige vers la connexion si aucun jeton
// n'est présent. Le contrôle de rôle fin reste porté par l'API (401/403) —
// ce composant évite seulement d'afficher une console vide sans session.
//
// L'état part de `null` (ni vrai ni faux) pour que le rendu initial soit
// identique côté serveur et côté client à l'hydratation — lire
// localStorage dans l'initialiseur de useState produirait des rendus
// différents (pas de window côté serveur) et déclencherait une erreur
// d'hydratation React.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const token = Boolean(getAuthToken());
    // Lecture d'un système externe (localStorage) au montage — le setState
    // qui suit n'est pas une boucle de rendu React->React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasToken(token);
    if (!token) {
      router.replace("/connexion");
    }
  }, [router]);

  if (!hasToken) return null;
  return <>{children}</>;
}
