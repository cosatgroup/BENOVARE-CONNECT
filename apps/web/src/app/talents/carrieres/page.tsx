import { VeilleDuMarche } from "@/components/carrieres/VeilleDuMarche";

export default function CarrieresTalentPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-xl font-semibold text-neutre-900">Carrières</h1>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutre-600">
          Offres de placement Benovare
        </h2>
        <p className="mt-2 text-sm text-neutre-600">
          Besoins de recrutement confiés directement à Benovare par des entreprises de la place —
          à venir.
        </p>
      </section>

      <VeilleDuMarche />
    </div>
  );
}
