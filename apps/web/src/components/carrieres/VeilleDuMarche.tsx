"use client";

import { useEffect, useState } from "react";
import { listerVeillePubliee, type OpportuniteExterne } from "@/lib/veille-api";

// §3.6 — Annonces collectées automatiquement sur des sites publics à
// travers l'Afrique, clairement identifiées comme « source externe » ;
// Benovare n'intervient pas dans leur processus de sélection. Affiché
// uniquement dans la console Talents (choix produit).
export function VeilleDuMarche() {
  const [items, setItems] = useState<OpportuniteExterne[] | null>(null);

  useEffect(() => {
    listerVeillePubliee().then(setItems);
  }, []);

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
        Veille des opportunités du marché
      </h2>
      <p className="mt-1 text-xs text-neutre-600">
        Annonces collectées sur des sites publics à travers l&apos;Afrique, en dehors du circuit
        Benovare.
      </p>

      <div className="mt-3 space-y-2">
        {items === null && <p className="text-sm text-neutre-600">Chargement…</p>}
        {items?.length === 0 && <p className="text-sm text-neutre-600">Aucune annonce pour le moment.</p>}
        {items?.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-neutre-200 bg-surface p-4 hover:bg-neutre-50"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="font-medium text-neutre-900">{item.titre}</p>
              <span className="shrink-0 rounded-full bg-neutre-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-neutre-600">
                Source externe
              </span>
            </div>
            <p className="mt-1 text-xs text-neutre-600">{item.source}</p>
            <p className="mt-2 line-clamp-2 text-sm text-neutre-600">{item.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
