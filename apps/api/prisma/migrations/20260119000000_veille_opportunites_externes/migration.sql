-- CreateEnum
CREATE TYPE "StatutModeration" AS ENUM ('EN_ATTENTE', 'APPROUVEE', 'REJETEE');

-- CreateTable
CREATE TABLE "OpportuniteExterne" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "publieLe" TIMESTAMP(3),
    "statutModeration" "StatutModeration" NOT NULL DEFAULT 'EN_ATTENTE',
    "collecteeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportuniteExterne_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpportuniteExterne_url_key" ON "OpportuniteExterne"("url");
