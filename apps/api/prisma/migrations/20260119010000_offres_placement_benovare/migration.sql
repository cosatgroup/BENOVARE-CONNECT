-- AlterTable: partenaireCompanyId devient optionnel (offres de placement
-- Benovare sans entreprise Partenaire rattachée), et on ajoute les colonnes
-- portant l'origine et le nom de l'entreprise cliente hors plateforme.

-- DropForeignKey
ALTER TABLE "Besoin" DROP CONSTRAINT "Besoin_partenaireCompanyId_fkey";

-- AlterTable
ALTER TABLE "Besoin" ALTER COLUMN "partenaireCompanyId" DROP NOT NULL;
ALTER TABLE "Besoin" ADD COLUMN "publieParBenovare" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Besoin" ADD COLUMN "entrepriseClienteNom" TEXT;

-- AddForeignKey
ALTER TABLE "Besoin" ADD CONSTRAINT "Besoin_partenaireCompanyId_fkey" FOREIGN KEY ("partenaireCompanyId") REFERENCES "PartenaireCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
