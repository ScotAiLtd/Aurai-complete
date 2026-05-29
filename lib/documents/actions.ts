"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { S3_BUCKET, buildDocumentKey, s3 } from "@/lib/s3";
import {
  recordDocumentSchema,
  uploadRequestSchema,
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
  await requireSession();

  const parsed = recordDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid document.",
    };
  }

  try {
    const doc = await prisma.document.create({
      data: {
        siteId,
        fileName: parsed.data.fileName,
        sizeBytes: BigInt(parsed.data.sizeBytes),
        s3Key: parsed.data.s3Key,
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

export async function deleteDocument(
  documentId: string,
  siteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { s3Key: true, siteId: true },
  });
  if (!doc) return { ok: false, error: "Document not found." };
  if (doc.siteId !== siteId) {
    return { ok: false, error: "Document does not belong to this site." };
  }

  try {
    await s3.send(
      new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: doc.s3Key }),
    );
    await prisma.document.delete({ where: { id: documentId } });
    revalidatePath(`/sites/${siteId}`);
    return { ok: true };
  } catch (err) {
    console.error("[documents] delete failed:", err);
    return { ok: false, error: "Could not delete document." };
  }
}
