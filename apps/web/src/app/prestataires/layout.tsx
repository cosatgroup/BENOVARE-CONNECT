import { DashboardShell } from "@/components/DashboardShell";
import { AuthGuard } from "@/components/AuthGuard";
import { consoles } from "@/lib/consoles";

export default function PrestatairesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell console={consoles.PRESTATAIRE} compteLabel="Mon entreprise">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
