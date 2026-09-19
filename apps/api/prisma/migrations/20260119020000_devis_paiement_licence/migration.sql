-- CreateEnum
CREATE TYPE "StatutDevis" AS ENUM ('EN_ATTENTE', 'PAYE', 'ANNULE');

-- CreateEnum
CREATE TYPE "MoyenPaiement" AS ENUM ('KKIAPAY', 'FEDAPAY', 'VIREMENT_BANCAIRE');

-- CreateTable
CREATE TABLE "Devis" (
    "id" TEXT NOT NULL,
    "talentProfileId" TEXT,
    "prestataireCompanyId" TEXT,
    "partenaireCompanyId" TEXT,
    "formule" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "statut" "StatutDevis" NOT NULL DEFAULT 'EN_ATTENTE',
    "moyenPaiement" "MoyenPaiement",
    "referenceExterne" TEXT,
    "payeLe" TIMESTAMP(3),
    "codeLicence" TEXT,
    "codeUtilise" BOOLEAN NOT NULL DEFAULT false,
    "codeEnvoyeLe" TIMESTAMP(3),
    "codeUtiliseLe" TIMESTAMP(3),
    "creeParUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Devis_codeLicence_key" ON "Devis"("codeLicence");

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_prestataireCompanyId_fkey" FOREIGN KEY ("prestataireCompanyId") REFERENCES "PrestataireCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_partenaireCompanyId_fkey" FOREIGN KEY ("partenaireCompanyId") REFERENCES "PartenaireCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
