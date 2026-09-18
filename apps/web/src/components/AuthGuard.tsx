"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth-client";

// Garde-fou client minimal : redirige vers la connexion si aucun jeton
// n'est présent. Le contrôle de rôle fin reste porté par l'API (401/403) —
// ce composant évite seulement d'afficher une console vide sans session.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hasToken] = useState<boolean>(() => Boolean(getAuthToken()));

  useEffect(() => {
    if (!hasToken) {
      router.replace("/connexion");
    }
  }, [hasToken, router]);

  if (!hasToken) return null;
  return <>{children}</>;
}
