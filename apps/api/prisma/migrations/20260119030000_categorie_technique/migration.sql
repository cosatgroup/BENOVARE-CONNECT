-- CreateTable
CREATE TABLE "CategorieTechnique" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "CategorieTechnique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategorieTechnique_nom_key" ON "CategorieTechnique"("nom");
