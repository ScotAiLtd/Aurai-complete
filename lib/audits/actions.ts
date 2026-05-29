"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { s3, S3_BUCKET } from "@/lib/s3";
import { auditConfigSchema, type AuditConfigInput } from "@/lib/schemas/audit";

type ActionResult =
  | { ok: true; auditId: string }
  | { ok: false; error: string };

// Long TTL: the auditor may queue the job before it downloads the file. ==> 24 hours
const AUDIT_URL_TTL_SECONDS = 24 * 60 * 60;

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
}

export async function startAudit(
  documentId: string,
  input: AuditConfigInput,
): Promise<ActionResult> {
  await requireSession();

  const parsed = auditConfigSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid audit config.",
    };
  }

  const auditorUrl = process.env.AUDITOR_URL;
  const callbackSecret = process.env.AUDIT_CALLBACK_SECRET;
  const appUrl = process.env.APP_URL;
  if (!auditorUrl || !callbackSecret || !appUrl) {
    console.error(
      "[audits] missing AUDITOR_URL / AUDIT_CALLBACK_SECRET / APP_URL",
    );
    return { ok: false, error: "Audit service is not configured." };
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, siteId: true, fileName: true, s3Key: true },
  });
  if (!document) return { ok: false, error: "Document not found." };

  // Create the audit row up front so the UI can show it as pending immediately.
  const audit = await prisma.audit.create({
    data: {
      documentId: document.id,
      mode: parsed.data.mode,
      status: "PENDING",
    },
    select: { id: true },
  });

  try {
    // Presigned URL the auditor uses to download the PDF directly from S3.
    const fileUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: document.s3Key }),
      { expiresIn: AUDIT_URL_TTL_SECONDS },
    );

    const config: Record<string, unknown> = {
      audit_mode: parsed.data.mode === "SUPER" ? "super" : "standard",
    };
    if (parsed.data.enabledAgents?.length) {
      config.enabled_agents = parsed.data.enabledAgents;
    }
    if (parsed.data.customAgentPrompt) {
      config.custom_agent_enabled = true;
      config.custom_agent_name =
        parsed.data.customAgentName || "Custom Analysis";
      config.custom_agent_prompt = parsed.data.customAgentPrompt;
    }

    const response = await fetch(`${auditorUrl}/api/v1/audits/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_url: fileUrl,
        filename: document.fileName,
        config,
        callback_url: `${appUrl}/api/audits/callback`,
        callback_secret: callbackSecret,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`Auditor responded ${response.status}`);
    }

    const data = (await response.json()) as { audit_id?: string };
    if (!data.audit_id) throw new Error("Auditor response missing audit_id");

    await prisma.audit.update({
      where: { id: audit.id },
      data: { externalAuditId: data.audit_id },
    });

    revalidatePath(`/sites/${document.siteId}`);
    return { ok: true, auditId: audit.id };
  } catch (err) {
    console.error("[audits] start failed:", err);
    await prisma.audit.update({
      where: { id: audit.id },
      data: {
        status: "FAILED",
        errorMessage: "Could not reach the audit service.",
        completedAt: new Date(),
      },
    });
    revalidatePath(`/sites/${document.siteId}`);
    return { ok: false, error: "Could not start the audit." };
  }
}

export type AuditIssueItem = {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  issueType: string;
  title: string;
  description: string;
  suggestion: string | null;
  pageNumber: number | null;
  section: string | null;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
};

export type AuditDetail = {
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  issuesFound: number;
  processingSeconds: number | null;
  issues: AuditIssueItem[];
};

export async function getAuditDetail(
  auditId: string,
): Promise<{ ok: true; detail: AuditDetail } | { ok: false; error: string }> {
  await requireSession();
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      select: {
        status: true,
        issuesFound: true,
        startedAt: true,
        completedAt: true,
        issues: {
          orderBy: [{ status: "asc" }, { severity: "asc" }],
          select: {
            id: true,
            severity: true,
            issueType: true,
            title: true,
            description: true,
            suggestion: true,
            pageNumber: true,
            section: true,
            status: true,
          },
        },
      },
    });
    if (!audit) return { ok: false, error: "Audit not found." };

    const processingSeconds = audit.completedAt
      ? Math.round(
          (audit.completedAt.getTime() - audit.startedAt.getTime()) / 1000,
        )
      : null;

    return {
      ok: true,
      detail: {
        status: audit.status,
        issuesFound: audit.issuesFound,
        processingSeconds,
        issues: audit.issues,
      },
    };
  } catch (err) {
    console.error("[audits] get detail failed:", err);
    return { ok: false, error: "Could not load audit." };
  }
}

export async function updateIssueStatus(
  issueId: string,
  status: "OPEN" | "RESOLVED" | "DISMISSED",
  siteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  try {
    await prisma.auditIssue.update({
      where: { id: issueId },
      data: { status, resolvedAt: status === "OPEN" ? null : new Date() },
    });
    revalidatePath(`/sites/${siteId}`);
    return { ok: true };
  } catch (err) {
    console.error("[audits] update issue failed:", err);
    return { ok: false, error: "Could not update the issue." };
  }
}
