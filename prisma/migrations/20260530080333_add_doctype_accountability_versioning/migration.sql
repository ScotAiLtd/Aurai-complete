/*
  Warnings:

  - You are about to drop the column `type` on the `turbine` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[previousVersionId]` on the table `document` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `docType` to the `document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedById` to the `document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `site` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `turbine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `turbineModelId` to the `turbine` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('AWP_SOURCE', 'REPORT', 'REFERENCE', 'OTHER');

-- AlterTable
ALTER TABLE "audit_issue" ADD COLUMN     "resolutionNote" TEXT,
ADD COLUMN     "resolvedById" TEXT;

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "docType" "DocType" NOT NULL,
ADD COLUMN     "markedReadyForAwpAt" TIMESTAMP(3),
ADD COLUMN     "markedReadyForAwpById" TEXT,
ADD COLUMN     "markedReadyForAwpNote" TEXT,
ADD COLUMN     "previousVersionId" TEXT,
ADD COLUMN     "uploadedById" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "site" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "turbine" DROP COLUMN "type",
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "turbineModelId" TEXT NOT NULL,
ADD COLUMN     "updatedById" TEXT;

-- CreateTable
CREATE TABLE "turbine_model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turbine_model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "turbine_model_name_key" ON "turbine_model"("name");

-- CreateIndex
CREATE UNIQUE INDEX "turbine_model_slug_key" ON "turbine_model"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "document_previousVersionId_key" ON "document"("previousVersionId");

-- CreateIndex
CREATE INDEX "document_docType_idx" ON "document"("docType");

-- CreateIndex
CREATE INDEX "document_uploadedById_idx" ON "document"("uploadedById");

-- CreateIndex
CREATE INDEX "document_deletedAt_idx" ON "document"("deletedAt");

-- CreateIndex
CREATE INDEX "site_createdById_idx" ON "site"("createdById");

-- CreateIndex
CREATE INDEX "turbine_turbineModelId_idx" ON "turbine"("turbineModelId");

-- CreateIndex
CREATE INDEX "turbine_createdById_idx" ON "turbine"("createdById");

-- AddForeignKey
ALTER TABLE "site" ADD CONSTRAINT "site_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site" ADD CONSTRAINT "site_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turbine" ADD CONSTRAINT "turbine_turbineModelId_fkey" FOREIGN KEY ("turbineModelId") REFERENCES "turbine_model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turbine" ADD CONSTRAINT "turbine_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turbine" ADD CONSTRAINT "turbine_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_markedReadyForAwpById_fkey" FOREIGN KEY ("markedReadyForAwpById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_issue" ADD CONSTRAINT "audit_issue_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
