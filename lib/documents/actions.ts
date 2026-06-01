"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { S3_BUCKET, buildDocumentKey, s3 } from "@/lib/s3";
import {
  markReadyForAwpSchema,
  recordDocumentSchema,
  uploadRequestSchema,
  type MarkReadyForAwpInput,
  type RecordDocumentInput,
  type UploadRequest,
} from "@/lib/schemas/document";

type ActionResult<T = { id: string }> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

const UPLOAD_URL_TTL_SECONDS = 60 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 15 * 60;

export async function getUploadUrl(
  siteId: string,
  input: UploadRequest,
): Promise<ActionResult<{ uploadUrl: string; s3Key: string }>> {
  await requireSession();

  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid file.",
    };
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true },
  });
  if (!site) return { ok: false, error: "Site not found." };

  const s3Key = buildDocumentKey(siteId, parsed.data.fileName);

  try {
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        ContentType: "application/pdf",
      }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS },
    );
    return { ok: true, uploadUrl, s3Key };
  } catch (err) {
    console.error("[documents] presign upload failed:", err);
    return { ok: false, error: "Could not prepare upload." };
  }
}

export async function recordDocument(
  siteId: string,
  input: RecordDocumentInput,
): Promise<ActionResult> {
  const session = await requireSession();

  const parsed = recordDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid document.",
    };
  }

  let version = 1;
  if (parsed.data.previousVersionId) {
    const prev = await prisma.document.findUnique({
      where: { id: parsed.data.previousVersionId },
      select: { id: true, siteId: true, version: true },
    });
    if (!prev || prev.siteId !== siteId) {
      return { ok: false, error: "Previous version not found in this site." };
    }
    version = prev.version + 1;
  }

  try {
    const doc = await prisma.document.create({
      data: {
        siteId,
        fileName: parsed.data.fileName,
        sizeBytes: BigInt(parsed.data.sizeBytes),
        s3Key: parsed.data.s3Key,
        docType: parsed.data.docType,
        uploadedById: session.user.id,
        version,
        previousVersionId: parsed.data.previousVersionId,
      },
      select: { id: true },
    });
    revalidatePath(`/sites/${siteId}`);
    return { ok: true, id: doc.id };
  } catch (err) {
    console.error("[documents] record failed:", err);
    return { ok: false, error: "Could not save document." };
  }
}

export async function getDownloadUrl(
  documentId: string,
): Promise<ActionResult<{ url: string }>> {
  await requireSession();

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { s3Key: true, fileName: true },
  });
  if (!doc) return { ok: false, error: "Document not found." };

  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: doc.s3Key,
        ResponseContentDisposition: `inline; filename="${doc.fileName.replace(/"/g, "")}"`,
      }),
      { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
    );
    return { ok: true, url };
  } catch (err) {
    console.error("[documents] presign download failed:", err);
    return { ok: false, error: "Could not generate download link." };
  }
}

// Soft delete — S3 object is retained so audit trail and version chain stay intact.
export async function deleteDocument(
  documentId: string,
  siteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireSession();

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { siteId: true, deletedAt: true },
  });
  if (!doc) return { ok: false, error: "Document not found." };
  if (doc.siteId !== siteId) {
    return { ok: false, error: "Document does not belong to this site." };
  }
  if (doc.deletedAt) return { ok: true };

  try {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
      },
    });
    revalidatePath(`/sites/${siteId}`);
    return { ok: true };
  } catch (err) {
    console.error("[documents] soft-delete failed:", err);
    return { ok: false, error: "Could not delete document." };
  }
}

export async function markDocumentReadyForAwp(
  documentId: string,
  siteId: string,
  input: MarkReadyForAwpInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireSession();

  const parsed = markReadyForAwpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      siteId: true,
      docType: true,
      deletedAt: true,
      audits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          _count: { select: { issues: { where: { status: "OPEN" } } } },
        },
      },
    },
  });
  if (!doc) return { ok: false, error: "Document not found." };
  if (doc.siteId !== siteId) {
    return { ok: false, error: "Document does not belong to this site." };
  }
  if (doc.deletedAt) {
    return { ok: false, error: "Document has been deleted." };
  }
  if (doc.docType !== "AWP_SOURCE") {
    return {
      ok: false,
      error: "Only AWP source documents can be marked ready for AWP.",
    };
  }
  const latestAudit = doc.audits[0];
  if (!latestAudit || latestAudit.status !== "COMPLETED") {
    return {
      ok: false,
      error: "Document must have a completed audit first.",
    };
  }
  if (latestAudit._count.issues > 0) {
    return {
      ok: false,
      error: "Resolve or dismiss all open audit issues first.",
    };
  }

  try {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        markedReadyForAwpById: session.user.id,
        markedReadyForAwpAt: new Date(),
        markedReadyForAwpNote: parsed.data.note,
      },
    });
    revalidatePath(`/sites/${siteId}`);
    return { ok: true };
  } catch (err) {
    console.error("[documents] mark ready failed:", err);
    return { ok: false, error: "Could not mark document ready." };
  }
}

export async function revokeAwpReadyStatus(
  documentId: string,
  siteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { siteId: true },
  });
  if (!doc) return { ok: false, error: "Document not found." };
  if (doc.siteId !== siteId) {
    return { ok: false, error: "Document does not belong to this site." };
  }

  try {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        markedReadyForAwpById: null,
        markedReadyForAwpAt: null,
        markedReadyForAwpNote: null,
      },
    });
    revalidatePath(`/sites/${siteId}`);
    return { ok: true };
  } catch (err) {
    console.error("[documents] revoke ready failed:", err);
    return { ok: false, error: "Could not revoke status." };
  }
}
