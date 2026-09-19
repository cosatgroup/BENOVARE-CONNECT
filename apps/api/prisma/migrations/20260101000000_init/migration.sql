-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TALENT', 'PRESTATAIRE', 'PARTENAIRE', 'GESTIONNAIRE', 'ADMINISTRATEUR');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIF', 'SUSPENDU', 'EN_ATTENTE_VALIDATION');

-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('SMS', 'EMAIL', 'APP');

-- CreateEnum
CREATE TYPE "PalierEtoiles" AS ENUM ('SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "FormulePartenaire" AS ENUM ('ESSENTIEL', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIREE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "Disponibilite" AS ENUM ('IMMEDIATE', 'A_PARTIR_DE');

-- CreateEnum
CREATE TYPE "Modalite" AS ENUM ('TEMPS_PLEIN', 'TEMPS_PARTIEL');

-- CreateEnum
CREATE TYPE "RolePrestataire" AS ENUM ('REPRESENTANT_LEGAL', 'GESTIONNAIRE_MISSIONS', 'CONSULTANT_TECHNIQUE', 'COMPTABILITE');

-- CreateEnum
CREATE TYPE "RolePartenaire" AS ENUM ('DIRECTION', 'RESPONSABLE_ACHATS_PROJETS', 'CONTACT_TECHNIQUE');

-- CreateEnum
CREATE TYPE "RoleInterne" AS ENUM ('ADMINISTRATEUR', 'SUPPORT');

-- CreateEnum
CREATE TYPE "TypeBesoin" AS ENUM ('RECRUTEMENT_TALENT', 'RECRUTEMENT_PRESTATAIRE', 'CONSEIL_AUDIT');

-- CreateEnum
CREATE TYPE "NiveauAccompagnement" AS ENUM ('MISE_EN_RELATION_SIMPLE', 'COORDINATION_ENTRETIENS', 'ACCOMPAGNEMENT_COMPLET');

-- CreateEnum
CREATE TYPE "StatutBesoin" AS ENUM ('OUVERT', 'EN_EVALUATION', 'CLOS');

-- CreateEnum
CREATE TYPE "StatutCandidature" AS ENUM ('SOUMISE', 'PRESELECTIONNEE', 'ENTRETIEN_PLANIFIE', 'ENTRETIEN_FINAL', 'ACCEPTEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "TypeEntretien" AS ENUM ('PREMIER_ENTRETIEN_BENOVARE', 'ENTRETIEN_FINAL_PARTENAIRE');

-- CreateEnum
CREATE TYPE "ResultatEntretien" AS ENUM ('EN_ATTENTE', 'FAVORABLE', 'DEFAVORABLE');

-- CreateEnum
CREATE TYPE "StatutMission" AS ENUM ('EN_COURS', 'CLOTUREE_CONFORME', 'CLOTUREE_AVEC_RESERVE', 'CLOTUREE_LITIGE');

-- CreateEnum
CREATE TYPE "StatutJalon" AS ENUM ('A_VENIR', 'EN_COURS', 'TERMINE');

-- CreateEnum
CREATE TYPE "TypeDemande" AS ENUM ('DELAI', 'AVENANT');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('PIECE_IDENTITE', 'REGISTRE_COMMERCE', 'ATTESTATION_FISCALE', 'ATTESTATION_ASSURANCE', 'CONTRAT', 'LIVRABLE', 'AUTRE');

-- CreateEnum
CREATE TYPE "CategorieNotification" AS ENUM ('OPPORTUNITE', 'ECHEANCE_CONTRACTUELLE', 'MESSAGE', 'ALERTE_SYSTEME');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'EN_ATTENTE_VALIDATION',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "channel" "OtpChannel" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "palierEtoiles" "PalierEtoiles",
    "formulePartenaire" "FormulePartenaire",
    "renouvellementAuto" BOOLEAN NOT NULL DEFAULT true,
    "prochainRenouvellement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenoms" TEXT NOT NULL,
    "linkedin" TEXT,
    "adresse" TEXT,
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "badgeMerite" BOOLEAN NOT NULL DEFAULT false,
    "profilUnicorn" BOOLEAN NOT NULL DEFAULT false,
    "disponibilite" "Disponibilite" NOT NULL DEFAULT 'IMMEDIATE',
    "disponibleLe" TIMESTAMP(3),
    "modalite" "Modalite" NOT NULL DEFAULT 'TEMPS_PLEIN',
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "subscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competence" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "preuveUrl" TEXT,
    "talentId" TEXT NOT NULL,

    CONSTRAINT "Competence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomaineExpertise" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "DomaineExpertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrestataireCompany" (
    "id" TEXT NOT NULL,
    "raisonSociale" TEXT NOT NULL,
    "secteurActivite" TEXT,
    "effectif" INTEGER,
    "anneeCreation" INTEGER,
    "coordonnees" TEXT,
    "verifieKYB" BOOLEAN NOT NULL DEFAULT false,
    "badgeMerite" BOOLEAN NOT NULL DEFAULT false,
    "profilUnicorn" BOOLEAN NOT NULL DEFAULT false,
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "subscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrestataireCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrestataireMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "RolePrestataire" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrestataireMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartenaireCompany" (
    "id" TEXT NOT NULL,
    "raisonSociale" TEXT NOT NULL,
    "secteurActivite" TEXT,
    "coordonnees" TEXT,
    "verifieKYB" BOOLEAN NOT NULL DEFAULT false,
    "gestionnaireCompteId" TEXT,
    "subscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartenaireCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartenaireMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "RolePartenaire" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartenaireMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GestionnaireProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GestionnaireProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "roleInterne" "RoleInterne" NOT NULL DEFAULT 'ADMINISTRATEUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Besoin" (
    "id" TEXT NOT NULL,
    "type" "TypeBesoin" NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "niveauEtoiles" INTEGER NOT NULL,
    "categorieTechnique" TEXT,
    "budgetIndicatif" TEXT,
    "delaiSouhaite" TEXT,
    "niveauAccompagnement" "NiveauAccompagnement" NOT NULL DEFAULT 'MISE_EN_RELATION_SIMPLE',
    "statut" "StatutBesoin" NOT NULL DEFAULT 'OUVERT',
    "partenaireCompanyId" TEXT NOT NULL,
    "prestataireCompanyId" TEXT,
    "criteresSoumission" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Besoin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidature" (
    "id" TEXT NOT NULL,
    "besoinId" TEXT NOT NULL,
    "statut" "StatutCandidature" NOT NULL DEFAULT 'SOUMISE',
    "talentId" TEXT,
    "prestataireCompanyId" TEXT,
    "equipeProposee" TEXT[],
    "messageMotive" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entretien" (
    "id" TEXT NOT NULL,
    "candidatureId" TEXT NOT NULL,
    "type" "TypeEntretien" NOT NULL,
    "planifieLe" TIMESTAMP(3),
    "gestionnaireId" TEXT,
    "representantEntrepriseInvite" BOOLEAN NOT NULL DEFAULT false,
    "resultat" "ResultatEntretien" NOT NULL DEFAULT 'EN_ATTENTE',
    "compteRendu" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entretien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "besoinId" TEXT NOT NULL,
    "statut" "StatutMission" NOT NULL DEFAULT 'EN_COURS',
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "echeance" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jalon" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "statut" "StatutJalon" NOT NULL DEFAULT 'A_VENIR',
    "echeance" TIMESTAMP(3),
    "termineLe" TIMESTAMP(3),

    CONSTRAINT "Jalon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livrable" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "documentId" TEXT,
    "deposeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valide" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Livrable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeAvenant" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "type" "TypeDemande" NOT NULL,
    "motif" TEXT NOT NULL,
    "dureeJours" INTEGER,
    "declarationAnticipee" BOOLEAN NOT NULL DEFAULT true,
    "complexite" TEXT,
    "statut" "StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "recommandationGestionnaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteLe" TIMESTAMP(3),

    CONSTRAINT "DemandeAvenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "talentId" TEXT,
    "prestataireCompanyId" TEXT,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustScoreEntry" (
    "id" TEXT NOT NULL,
    "talentId" TEXT,
    "prestataireCompanyId" TEXT,
    "delta" INTEGER NOT NULL,
    "raison" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustScoreEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeDocument" NOT NULL,
    "url" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "prestataireCompanyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categorie" "CategorieNotification" NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "cible" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DomaineExpertiseToTalentProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DomaineExpertiseToTalentProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_userId_key" ON "TalentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_subscriptionId_key" ON "TalentProfile"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "DomaineExpertise_nom_key" ON "DomaineExpertise"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "PrestataireCompany_subscriptionId_key" ON "PrestataireCompany"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "PrestataireMember_userId_key" ON "PrestataireMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PartenaireCompany_subscriptionId_key" ON "PartenaireCompany"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "PartenaireMember_userId_key" ON "PartenaireMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GestionnaireProfile_userId_key" ON "GestionnaireProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_besoinId_key" ON "Mission"("besoinId");

-- CreateIndex
CREATE INDEX "_DomaineExpertiseToTalentProfile_B_index" ON "_DomaineExpertiseToTalentProfile"("B");

-- AddForeignKey
ALTER TABLE "OtpCode" ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginEvent" ADD CONSTRAINT "LoginEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentProfile" ADD CONSTRAINT "TalentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentProfile" ADD CONSTRAINT "TalentProfile_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competence" ADD CONSTRAINT "Competence_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "TalentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestataireCompany" ADD CONSTRAINT "PrestataireCompany_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestataireMember" ADD CONSTRAINT "PrestataireMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestataireMember" ADD CONSTRAINT "PrestataireMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "PrestataireCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartenaireCompany" ADD CONSTRAINT "PartenaireCompany_gestionnaireCompteId_fkey" FOREIGN KEY ("gestionnaireCompteId") REFERENCES "GestionnaireProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartenaireCompany" ADD CONSTRAINT "PartenaireCompany_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartenaireMember" ADD CONSTRAINT "PartenaireMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartenaireMember" ADD CONSTRAINT "PartenaireMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "PartenaireCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GestionnaireProfile" ADD CONSTRAINT "GestionnaireProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Besoin" ADD CONSTRAINT "Besoin_partenaireCompanyId_fkey" FOREIGN KEY ("partenaireCompanyId") REFERENCES "PartenaireCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_besoinId_fkey" FOREIGN KEY ("besoinId") REFERENCES "Besoin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "TalentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_prestataireCompanyId_fkey" FOREIGN KEY ("prestataireCompanyId") REFERENCES "PrestataireCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entretien" ADD CONSTRAINT "Entretien_candidatureId_fkey" FOREIGN KEY ("candidatureId") REFERENCES "Candidature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entretien" ADD CONSTRAINT "Entretien_gestionnaireId_fkey" FOREIGN KEY ("gestionnaireId") REFERENCES "GestionnaireProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_besoinId_fkey" FOREIGN KEY ("besoinId") REFERENCES "Besoin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jalon" ADD CONSTRAINT "Jalon_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livrable" ADD CONSTRAINT "Livrable_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livrable" ADD CONSTRAINT "Livrable_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeAvenant" ADD CONSTRAINT "DemandeAvenant_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "TalentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_prestataireCompanyId_fkey" FOREIGN KEY ("prestataireCompanyId") REFERENCES "PrestataireCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustScoreEntry" ADD CONSTRAINT "TrustScoreEntry_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "TalentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustScoreEntry" ADD CONSTRAINT "TrustScoreEntry_prestataireCompanyId_fkey" FOREIGN KEY ("prestataireCompanyId") REFERENCES "PrestataireCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_prestataireCompanyId_fkey" FOREIGN KEY ("prestataireCompanyId") REFERENCES "PrestataireCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DomaineExpertiseToTalentProfile" ADD CONSTRAINT "_DomaineExpertiseToTalentProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "DomaineExpertise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DomaineExpertiseToTalentProfile" ADD CONSTRAINT "_DomaineExpertiseToTalentProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

