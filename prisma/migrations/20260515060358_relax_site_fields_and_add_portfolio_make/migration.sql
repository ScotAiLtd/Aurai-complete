-- AlterTable
ALTER TABLE "site" ADD COLUMN     "portfolio" TEXT,
ADD COLUMN     "turbineMake" TEXT,
ALTER COLUMN "spv" DROP NOT NULL,
ALTER COLUMN "oAndMProvider" DROP NOT NULL;
