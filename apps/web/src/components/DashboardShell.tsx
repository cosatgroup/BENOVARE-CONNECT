import Image from "next/image";
import Link from "next/link";
import type { ConsoleConfig } from "@/lib/consoles";
import { NotificationButton } from "./NotificationButton";

interface DashboardShellProps {
  console: ConsoleConfig;
  compteLabel: string;
  children: React.ReactNode;
}

export function DashboardShell({ console: consoleConfig, compteLabel, children }: DashboardShellProps) {
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
        <main className="flex-1 bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
