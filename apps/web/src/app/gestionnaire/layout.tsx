import { DashboardShell } from "@/components/DashboardShell";
import { consoles } from "@/lib/consoles";

export default function GestionnaireLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell console={consoles.GESTIONNAIRE} compteLabel="Équipe Benovare">
      {children}
    </DashboardShell>
  );
}
