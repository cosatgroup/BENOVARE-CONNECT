import { DashboardShell } from "@/components/DashboardShell";
import { AuthGuard } from "@/components/AuthGuard";
import { consoles } from "@/lib/consoles";

export default function AdministrateurLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell console={consoles.ADMINISTRATEUR} compteLabel="Équipe dirigeante">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
