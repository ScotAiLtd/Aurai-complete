-- CreateEnum
CREATE TYPE "TurbineStatus" AS ENUM ('WORKING', 'IN_USE', 'SUSPENDED', 'NOT_OPERATIONAL');

-- CreateTable
CREATE TABLE "site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spv" TEXT NOT NULL,
    "oAndMProvider" TEXT NOT NULL,
    "numberOfTurbines" INTEGER NOT NULL,
    "technology" TEXT,
    "totalCapacityMw" DECIMAL(10,2),
    "commissioningDate" TIMESTAMP(3),
    "operationalSince" TIMESTAMP(3),
    "assetManager" TEXT,
    "turbineOem" TEXT,
    "turbineModel" TEXT,
    "turbineRating" DECIMAL(10,2),
    "projectStatus" TEXT,
    "lifeExpectancy" INTEGER,
    "lifeExtension" INTEGER,
    "gridConnectionType" TEXT,
    "dno" TEXT,
    "hubHeight" DECIMAL(8,2),
    "rotorDiameter" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turbine" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "serial" TEXT,
    "status" "TurbineStatus" NOT NULL DEFAULT 'WORKING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turbine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_name_key" ON "site"("name");

-- CreateIndex
CREATE INDEX "turbine_siteId_idx" ON "turbine"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "turbine_siteId_name_key" ON "turbine"("siteId", "name");

-- AddForeignKey
ALTER TABLE "turbine" ADD CONSTRAINT "turbine_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
