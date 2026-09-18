import { DashboardShell } from "@/components/DashboardShell";
import { consoles } from "@/lib/consoles";

export default function AdministrateurLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell console={consoles.ADMINISTRATEUR} compteLabel="Équipe dirigeante">
      {children}
    </DashboardShell>
  );
}
