"use client";

import { useCallback, useEffect, useState } from "react";
import { getMonEntreprise, type PartenaireCompany } from "@/lib/partenaires-api";

interface State {
  company: PartenaireCompany | null;
  loading: boolean;
  needsOnboarding: boolean;
}

export function useEntreprise() {
  const [state, setState] = useState<State>({ company: null, loading: true, needsOnboarding: false });

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const company = await getMonEntreprise();
      setState({ company, loading: false, needsOnboarding: false });
    } catch {
      // 404 attendu tant que l'entreprise n'a pas été créée (§5.1).
      setState({ company: null, loading: false, needsOnboarding: true });
    }
  }, []);

  useEffect(() => {
    // Chargement initial depuis l'API (système externe) au montage — le
    // setState qui en résulte est asynchrone, pas synchrone dans l'effet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
