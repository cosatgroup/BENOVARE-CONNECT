import { DashboardShell } from "@/components/DashboardShell";
import { AuthGuard } from "@/components/AuthGuard";
import { consoles } from "@/lib/consoles";

export default function TalentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell console={consoles.TALENT} compteLabel="Mon compte">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
