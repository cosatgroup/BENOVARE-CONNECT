import { DashboardShell } from "@/components/DashboardShell";
import { consoles } from "@/lib/consoles";

export default function PartenairesLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell console={consoles.PARTENAIRE} compteLabel="Mon entreprise">
      {children}
    </DashboardShell>
  );
}
