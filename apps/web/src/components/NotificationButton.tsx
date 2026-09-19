"use client";

import { useEffect, useState } from "react";
import {
  listerNotifications,
  marquerLue,
  toutMarquerLu,
  type AppNotification,
} from "@/lib/notifications-api";

// Centre de notifications transversal (§2 des spécifications) : un bouton
// unique regroupant opportunités, échéances contractuelles, messages et
// alertes système, présent sur toutes les pages d'accueil.
export function NotificationButton() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [nonLues, setNonLues] = useState(0);

  function refresh() {
    listerNotifications()
      .then((data) => {
        setNotifications(data.notifications);
        setNonLues(data.nonLues);
      })
      .catch(() => {
        // Console publique (ex. pages d'auth) sans session — pas de bruit.
      });
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, []);

  async function handleClickNotification(n: AppNotification) {
    if (!n.lu) {
      await marquerLue(n.id);
      refresh();
    }
  }

  async function handleToutLire() {
    await toutMarquerLu();
    refresh();
  }

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
        {nonLues > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-connect text-[10px] font-medium text-white">
            {nonLues > 9 ? "9+" : nonLues}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-neutre-200 bg-surface p-3 shadow-lg">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-sm font-medium text-neutre-900">Notifications</span>
            {nonLues > 0 && (
              <button onClick={handleToutLire} className="text-xs font-medium text-vert-benovare">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {notifications === null && <p className="p-2 text-sm text-neutre-600">Chargement…</p>}
            {notifications?.length === 0 && (
              <p className="p-2 text-sm text-neutre-600">Aucune notification pour le moment.</p>
            )}
            {notifications?.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`block w-full rounded-md p-2 text-left text-sm hover:bg-neutre-50 ${
                  n.lu ? "text-neutre-600" : "bg-neutre-50 text-neutre-900"
                }`}
              >
                <p className="font-medium">{n.titre}</p>
                <p className="mt-0.5 text-xs text-neutre-600">{n.contenu}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
