import { DashboardShell } from "@/components/DashboardShell";
import { AuthGuard } from "@/components/AuthGuard";
import { consoles } from "@/lib/consoles";

export default function PartenairesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell console={consoles.PARTENAIRE} compteLabel="Mon entreprise">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
