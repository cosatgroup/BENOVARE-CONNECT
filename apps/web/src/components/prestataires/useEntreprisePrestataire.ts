"use client";

import { useCallback, useEffect, useState } from "react";
import { getMonEntreprise, type PrestataireCompany } from "@/lib/prestataires-api";

interface State {
  company: PrestataireCompany | null;
  loading: boolean;
  needsOnboarding: boolean;
}

export function useEntreprisePrestataire() {
  const [state, setState] = useState<State>({ company: null, loading: true, needsOnboarding: false });

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const company = await getMonEntreprise();
      setState({ company, loading: false, needsOnboarding: false });
    } catch {
      setState({ company: null, loading: false, needsOnboarding: true });
    }
  }, []);

  useEffect(() => {
    // Chargement initial depuis l'API (système externe) au montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
