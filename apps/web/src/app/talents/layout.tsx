import { DashboardShell } from "@/components/DashboardShell";
import { consoles } from "@/lib/consoles";

export default function TalentsLayout({ children }: { children: React.ReactNode }) {
  // TODO: remplacer par le profil de la session une fois l'auth branchée au frontend.
  return (
    <DashboardShell console={consoles.TALENT} compteLabel="Mon compte">
      {children}
    </DashboardShell>
  );
}
