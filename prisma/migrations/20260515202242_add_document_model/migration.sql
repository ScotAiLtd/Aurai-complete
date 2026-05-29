-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_s3Key_key" ON "document"("s3Key");

-- CreateIndex
CREATE INDEX "document_siteId_idx" ON "document"("siteId");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
