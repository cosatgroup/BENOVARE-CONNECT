import { DashboardShell } from "@/components/DashboardShell";
import { AuthGuard } from "@/components/AuthGuard";
import { consoles } from "@/lib/consoles";

export default function GestionnaireLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell console={consoles.GESTIONNAIRE} compteLabel="Équipe Benovare">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
