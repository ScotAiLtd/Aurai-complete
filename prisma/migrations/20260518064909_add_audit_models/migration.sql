-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditMode" AS ENUM ('STANDARD', 'SUPER');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "audit" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "externalAuditId" TEXT,
    "status" "AuditStatus" NOT NULL DEFAULT 'PENDING',
    "mode" "AuditMode" NOT NULL DEFAULT 'SUPER',
    "overallScore" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION,
    "issuesFound" INTEGER NOT NULL DEFAULT 0,
    "reportJson" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_issue" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "issueType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestion" TEXT,
    "pageNumber" INTEGER,
    "section" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audit_externalAuditId_key" ON "audit"("externalAuditId");

-- CreateIndex
CREATE INDEX "audit_documentId_idx" ON "audit"("documentId");

-- CreateIndex
CREATE INDEX "audit_issue_auditId_idx" ON "audit_issue"("auditId");

-- AddForeignKey
ALTER TABLE "audit" ADD CONSTRAINT "audit_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_issue" ADD CONSTRAINT "audit_issue_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
