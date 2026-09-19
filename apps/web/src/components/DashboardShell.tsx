"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ConsoleConfig } from "@/lib/consoles";
import { getMe, type Me } from "@/lib/api";
import { NotificationButton } from "./NotificationButton";

interface DashboardShellProps {
  console: ConsoleConfig;
  compteLabel: string;
  children: React.ReactNode;
}

const ROLES_AVEC_ESSAI = ["TALENT", "PRESTATAIRE", "PARTENAIRE"];

function joursRestants(essaiExpireLe: string): number {
  const ms = new Date(essaiExpireLe).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function DashboardShell({ console: consoleConfig, compteLabel, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    getMe()
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  const soumisAEssai = me ? ROLES_AVEC_ESSAI.includes(me.role) : false;
  const estSurPageAbonnement = pathname?.includes("/abonnement") ?? false;
  const essaiExpire = soumisAEssai && me ? !me.accesActif : false;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-neutre-200 bg-surface flex flex-col">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-neutre-200">
          <Image src="/logo/connect-icone-couleur.svg" alt="" width={28} height={28} />
          <span className="font-semibold text-sm tracking-wide text-neutre-900">
            BENOVARE CONNECT
          </span>
        </div>

        <div className="px-5 py-4 border-b border-neutre-200">
          <p className="text-xs uppercase tracking-wide text-neutre-600">{consoleConfig.nomConsole}</p>
          <p className="text-sm font-medium text-neutre-900 mt-1">{compteLabel}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {consoleConfig.nav.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-neutre-900 hover:bg-neutre-100"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-neutre-600 cursor-not-allowed"
                title="Écran à venir"
              >
                {item.label}
                <span className="text-[10px] uppercase tracking-wide text-orange-connect">Bientôt</span>
              </span>
            )
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-neutre-200 bg-surface px-6 py-3">
          <NotificationButton />
        </header>

        {soumisAEssai && me && !me.abonnementActif && me.accesActif && me.essaiExpireLe && (
          <div className="bg-orange-connect/10 px-6 py-2 text-sm text-orange-fonce">
            Il vous reste {joursRestants(me.essaiExpireLe)} jour(s) d&apos;essai gratuit.{" "}
            <Link href={`${consoleConfig.basePath}/abonnement`} className="font-medium underline">
              Souscrire un abonnement
            </Link>
          </div>
        )}

        <main className="flex-1 bg-background p-6">
          {essaiExpire && !estSurPageAbonnement ? (
            <div className="mx-auto max-w-lg rounded-xl border border-neutre-200 bg-surface p-8 text-center">
              <h1 className="text-lg font-semibold text-neutre-900">Votre période d&apos;essai est terminée</h1>
              <p className="mt-2 text-sm text-neutre-600">
                Les 30 jours d&apos;essai gratuit de votre compte sont écoulés. Pour continuer à
                utiliser Benovare Connect, souscrivez un abonnement, ou contactez Benovare pour toute
                question.
              </p>
              <div className="mt-5 flex flex-col items-center gap-2">
                <Link
                  href={`${consoleConfig.basePath}/abonnement`}
                  className="rounded-md bg-vert-benovare px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Souscrire un abonnement
                </Link>
                <a href="mailto:contact@benovare.com" className="text-sm text-neutre-600 underline">
                  Contacter Benovare
                </a>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
