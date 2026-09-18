"use client";

import { useState } from "react";

// Centre de notifications transversal (§2 des spécifications) : un bouton
// unique regroupant opportunités, échéances contractuelles, messages et
// alertes système. Le contenu réel sera branché sur l'API dans une étape
// suivante ; ce composant pose l'emplacement partagé par toutes les consoles.
export function NotificationButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-neutre-600 hover:bg-neutre-100"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-neutre-200 bg-surface p-4 shadow-lg text-sm text-neutre-600">
          Aucune notification pour le moment.
        </div>
      )}
    </div>
  );
}
