import { DashboardShell } from "@/components/DashboardShell";
import { consoles } from "@/lib/consoles";

export default function PrestatairesLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell console={consoles.PRESTATAIRE} compteLabel="Mon entreprise">
      {children}
    </DashboardShell>
  );
}
