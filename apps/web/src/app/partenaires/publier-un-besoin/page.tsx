"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEntreprise } from "@/components/partenaires/useEntreprise";
import { OnboardingEntreprise } from "@/components/partenaires/OnboardingEntreprise";
import { publierBesoin, type NiveauAccompagnement, type TypeBesoin } from "@/lib/partenaires-api";

const TYPES: { value: TypeBesoin; label: string; description: string }[] = [
  {
    value: "RECRUTEMENT_TALENT",
    label: "Recrutement de talent",
    description: "Avis simple, publié dans Opportunités des Talents.",
  },
  {
    value: "RECRUTEMENT_PRESTATAIRE",
    label: "Recrutement de prestataire",
    description: "Appel d'offres, catalogue Projets des Prestataires.",
  },
  {
    value: "CONSEIL_AUDIT",
    label: "Conseil & audit",
    description: "Étude de faisabilité, audit, recommandations.",
  },
];

const ACCOMPAGNEMENTS: { value: NiveauAccompagnement; label: string; description: string }[] = [
  {
    value: "MISE_EN_RELATION_SIMPLE",
    label: "Mise en relation simple",
    description: "Vous gérez la suite du processus vous-même.",
  },
  {
    value: "COORDINATION_ENTRETIENS",
    label: "Coordination des entretiens par Benovare",
    description: "Benovare planifie et mène le premier entretien.",
  },
  {
    value: "ACCOMPAGNEMENT_COMPLET",
    label: "Accompagnement complet avec pilotage",
    description: "Sourcing, sélection et pilotage assurés par Benovare.",
  },
];

export default function PublierUnBesoinPage() {
  const router = useRouter();
  const { company, loading: loadingCompany, needsOnboarding, refetch } = useEntreprise();

  const [type, setType] = useState<TypeBesoin>("RECRUTEMENT_TALENT");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [niveauEtoiles, setNiveauEtoiles] = useState(2);
  const [categorieTechnique, setCategorieTechnique] = useState("");
  const [budgetIndicatif, setBudgetIndicatif] = useState("");
  const [delaiSouhaite, setDelaiSouhaite] = useState("");
  const [niveauAccompagnement, setNiveauAccompagnement] = useState<NiveauAccompagnement>(
    "MISE_EN_RELATION_SIMPLE"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (loadingCompany) return null;
  if (needsOnboarding) return <OnboardingEntreprise onCreated={refetch} />;
  if (!company) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await publierBesoin({
        type,
        titre,
        description,
        niveauEtoiles,
        categorieTechnique: categorieTechnique || undefined,
        budgetIndicatif: budgetIndicatif || undefined,
        delaiSouhaite: delaiSouhaite || undefined,
        niveauAccompagnement,
      });
      router.push("/partenaires/candidatures");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-neutre-900">Publier un besoin</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutre-900">Type de besoin</label>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-lg border p-3 text-left text-sm ${
                  type === t.value
                    ? "border-vert-benovare bg-neutre-50"
                    : "border-neutre-200 hover:bg-neutre-50"
                }`}
              >
                <p className="font-medium text-neutre-900">{t.label}</p>
                <p className="mt-1 text-xs text-neutre-600">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutre-900">Titre</label>
          <input
            required
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            placeholder="Ex. Développeur Full-Stack — mission 3 mois"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutre-900">Description du besoin</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutre-900">
              Niveau d&apos;exigence ({niveauEtoiles}/4)
            </label>
            <input
              type="range"
              min={1}
              max={4}
              value={niveauEtoiles}
              onChange={(e) => setNiveauEtoiles(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutre-900">Catégorie technique</label>
            <input
              value={categorieTechnique}
              onChange={(e) => setCategorieTechnique(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutre-900">Budget indicatif</label>
            <input
              value={budgetIndicatif}
              onChange={(e) => setBudgetIndicatif(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
              placeholder="Ex. 4 000 000 – 6 000 000 FCFA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutre-900">Délai souhaité</label>
            <input
              value={delaiSouhaite}
              onChange={(e) => setDelaiSouhaite(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutre-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutre-900">Niveau d&apos;accompagnement</label>
          <div className="mt-2 space-y-2">
            {ACCOMPAGNEMENTS.map((a) => (
              <label
                key={a.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                  niveauAccompagnement === a.value
                    ? "border-vert-benovare bg-neutre-50"
                    : "border-neutre-200"
                }`}
              >
                <input
                  type="radio"
                  className="mt-1"
                  checked={niveauAccompagnement === a.value}
                  onChange={() => setNiveauAccompagnement(a.value)}
                />
                <span>
                  <span className="block font-medium text-neutre-900">{a.label}</span>
                  <span className="block text-xs text-neutre-600">{a.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-orange-fonce">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-vert-benovare px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Publication…" : "Publier le besoin"}
        </button>
      </form>
    </div>
  );
}
