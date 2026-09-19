"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listerPlacementsTalents, type Placement } from "@/lib/placements-api";
import { VeilleDuMarche } from "@/components/carrieres/VeilleDuMarche";

export default function CarrieresTalentPage() {
  const [placements, setPlacements] = useState<Placement[] | null>(null);

  useEffect(() => {
    listerPlacementsTalents().then(setPlacements);
  }, []);

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-xl font-semibold text-neutre-900">Carrières</h1>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Offres de placement Benovare
        </h2>
        <p className="mt-1 text-xs text-neutre-600">
          Besoins de recrutement confiés directement à Benovare par des entreprises de la place —
          parcours identique à un projet classique : premier entretien Benovare, puis entretien
          final avec l&apos;entreprise cliente.
        </p>

        <div className="mt-3 space-y-2">
          {placements === null && <p className="text-sm text-neutre-600">Chargement…</p>}
          {placements?.length === 0 && (
            <p className="text-sm text-neutre-600">Aucune offre de placement pour le moment.</p>
          )}
          {placements?.map((p) => (
            <Link
              key={p.id}
              href={`/talents/opportunites/${p.id}`}
              className="block rounded-lg border border-neutre-200 bg-surface p-4 hover:bg-neutre-50"
            >
              <p className="font-medium text-neutre-900">{p.titre}</p>
              <p className="mt-1 text-xs text-neutre-600">
                Client : {p.entrepriseClienteNom} · {p.niveauEtoiles} étoile{p.niveauEtoiles > 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <VeilleDuMarche />
    </div>
  );
}
