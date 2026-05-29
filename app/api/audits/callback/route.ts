import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import type { IssueSeverity } from "@/app/generated/prisma/enums";

export const runtime = "nodejs";

type RawIssue = {
  issue_type?: string;
  severity?: string;
  title?: string;
  description?: string;
  suggestion?: string | null;
  location?: { page_number?: number | null; section?: string | null } | null;
};

type AuditReport = {
  audit_summary?: {
    overall_score?: number;
    confidence_score?: number;
    total_issues?: number;
  };
  issues_by_category?: Record<string, RawIssue[]>;
};

type CallbackPayload = {
  audit_id?: string;
  status?: string;
  report?: AuditReport | null;
  error?: string | null;
};

const SEVERITY_MAP: Record<string, IssueSeverity> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

function verifySignature(
  body: string,
  header: string | null,
  secret: string,
): boolean {
  if (!header) return false;
  const expected =
    "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function extractIssues(report: AuditReport) {
  const byCategory = report.issues_by_category;
  if (!byCategory || typeof byCategory !== "object") return [];

  return Object.values(byCategory)
    .filter(Array.isArray)
    .flat()
    .map((issue: RawIssue) => ({
      severity:
        SEVERITY_MAP[String(issue?.severity).toLowerCase()] ?? "MEDIUM",
      issueType: String(issue?.issue_type ?? "unknown"),
      title: String(issue?.title ?? "Untitled issue"),
      description: String(issue?.description ?? ""),
      suggestion: issue?.suggestion ? String(issue.suggestion) : null,
      pageNumber:
        typeof issue?.location?.page_number === "number"
          ? issue.location.page_number
          : null,
      section: issue?.location?.section ? String(issue.location.section) : null,
    }));
}

export async function POST(request: Request) {
  const secret = process.env.AUDIT_CALLBACK_SECRET;
  if (!secret) {
    console.error("[audit-callback] AUDIT_CALLBACK_SECRET not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const body = await request.text();
  if (!verifySignature(body, request.headers.get("x-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: CallbackPayload;
  try {
    payload = JSON.parse(body) as CallbackPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.audit_id) {
    return NextResponse.json({ error: "Missing audit_id" }, { status: 400 });
  }

  const audit = await prisma.audit.findUnique({
    where: { externalAuditId: payload.audit_id },
    select: { id: true, document: { select: { siteId: true } } },
  });
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  try {
    if (payload.status === "completed" && payload.report) {
      const summary = payload.report.audit_summary ?? {};
      const issues = extractIssues(payload.report);

      await prisma.$transaction([
        prisma.audit.update({
          where: { id: audit.id },
          data: {
            status: "COMPLETED",
            reportJson: payload.report,
            overallScore:
              typeof summary.overall_score === "number"
                ? summary.overall_score
                : null,
            confidenceScore:
              typeof summary.confidence_score === "number"
                ? summary.confidence_score
                : null,
            issuesFound: issues.length,
            completedAt: new Date(),
          },
        }),
        prisma.auditIssue.createMany({
          data: issues.map((i) => ({ ...i, auditId: audit.id })),
        }),
      ]);
    } else {
      await prisma.audit.update({
        where: { id: audit.id },
        data: {
          status: "FAILED",
          errorMessage: payload.error ?? "Audit failed.",
          completedAt: new Date(),
        },
      });
    }

    revalidatePath(`/sites/${audit.document.siteId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[audit-callback] processing failed:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
