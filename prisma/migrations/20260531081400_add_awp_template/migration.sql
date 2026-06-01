-- CreateEnum
CREATE TYPE "AwpTemplateStatus" AS ENUM ('CONVERTING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "awp_template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourcePdfS3Key" TEXT NOT NULL,
    "templateHtml" TEXT,
    "slotsJson" JSONB,
    "status" "AwpTemplateStatus" NOT NULL DEFAULT 'CONVERTING',
    "conversionError" TEXT,
    "turbineModelId" TEXT,
    "jobType" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "awp_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "awp_template_status_idx" ON "awp_template"("status");

-- CreateIndex
CREATE INDEX "awp_template_turbineModelId_idx" ON "awp_template"("turbineModelId");

-- CreateIndex
CREATE INDEX "awp_template_createdById_idx" ON "awp_template"("createdById");

-- CreateIndex
CREATE INDEX "awp_template_deletedAt_idx" ON "awp_template"("deletedAt");

-- AddForeignKey
ALTER TABLE "awp_template" ADD CONSTRAINT "awp_template_turbineModelId_fkey" FOREIGN KEY ("turbineModelId") REFERENCES "turbine_model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awp_template" ADD CONSTRAINT "awp_template_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
