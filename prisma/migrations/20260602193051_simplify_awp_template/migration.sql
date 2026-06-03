/*
  Warnings:

  - You are about to drop the column `conversionError` on the `awp_template` table. All the data in the column will be lost.
  - You are about to drop the column `slotsJson` on the `awp_template` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `awp_template` table. All the data in the column will be lost.
  - You are about to drop the column `templateHtml` on the `awp_template` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "awp_template_status_idx";

-- AlterTable
ALTER TABLE "awp_template" DROP COLUMN "conversionError",
DROP COLUMN "slotsJson",
DROP COLUMN "status",
DROP COLUMN "templateHtml";

-- DropEnum
DROP TYPE "AwpTemplateStatus";
