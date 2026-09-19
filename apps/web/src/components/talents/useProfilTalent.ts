"use client";

import { useCallback, useEffect, useState } from "react";
import { getMonProfil, type TalentProfile } from "@/lib/talents-api";

interface State {
  profil: TalentProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
}

export function useProfilTalent() {
  const [state, setState] = useState<State>({ profil: null, loading: true, needsOnboarding: false });

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const profil = await getMonProfil();
      setState({ profil, loading: false, needsOnboarding: false });
    } catch {
      // 404 attendu tant que le profil n'a pas été complété (§3.1).
      setState({ profil: null, loading: false, needsOnboarding: true });
    }
  }, []);

  useEffect(() => {
    // Chargement initial depuis l'API (système externe) au montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
