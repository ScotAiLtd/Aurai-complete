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
import { S3_BUCKET, buildTemplateKey, s3 } from "@/lib/s3";
import {
  recordTemplateSchema,
  templateUploadRequestSchema,
  type RecordTemplateInput,
  type TemplateUploadRequest,
} from "@/lib/schemas/awp-template";

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

export async function getTemplateUploadUrl(
  input: TemplateUploadRequest,
): Promise<ActionResult<{ uploadUrl: string; s3Key: string }>> {
  await requireSession();

  const parsed = templateUploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid file.",
    };
  }

  const s3Key = buildTemplateKey(parsed.data.fileName);

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
    console.error("[awp-templates] presign upload failed:", err);
    return { ok: false, error: "Could not prepare upload." };
  }
}

export async function recordTemplate(
  input: RecordTemplateInput,
): Promise<ActionResult> {
  const session = await requireSession();

  const parsed = recordTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid template.",
    };
  }

  try {
    const template = await prisma.awpTemplate.create({
      data: {
        name: parsed.data.name,
        sourcePdfS3Key: parsed.data.s3Key,
        turbineModelId: parsed.data.turbineModelId,
        jobType: parsed.data.jobType,
        createdById: session.user.id,
      },
      select: { id: true },
    });
    revalidatePath("/templates");
    return { ok: true, id: template.id };
  } catch (err) {
    console.error("[awp-templates] record failed:", err);
    return { ok: false, error: "Could not save template." };
  }
}

export async function getTemplatePdfUrl(
  templateId: string,
): Promise<ActionResult<{ url: string }>> {
  await requireSession();

  const t = await prisma.awpTemplate.findUnique({
    where: { id: templateId },
    select: { sourcePdfS3Key: true, name: true },
  });
  if (!t) return { ok: false, error: "Template not found." };

  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: t.sourcePdfS3Key,
        ResponseContentDisposition: `inline; filename="${t.name.replace(/"/g, "")}.pdf"`,
      }),
      { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
    );
    return { ok: true, url };
  } catch (err) {
    console.error("[awp-templates] presign pdf failed:", err);
    return { ok: false, error: "Could not generate link." };
  }
}

export async function deleteTemplate(
  templateId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();

  const t = await prisma.awpTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, deletedAt: true },
  });
  if (!t) return { ok: false, error: "Template not found." };
  if (t.deletedAt) return { ok: true };

  try {
    await prisma.awpTemplate.update({
      where: { id: templateId },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/templates");
    return { ok: true };
  } catch (err) {
    console.error("[awp-templates] soft-delete failed:", err);
    return { ok: false, error: "Could not delete template." };
  }
}
