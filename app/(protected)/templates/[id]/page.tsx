import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import prisma from "@/lib/prisma";
import { S3_BUCKET, s3 } from "@/lib/s3";
import { Badge } from "@/components/ui/badge";
import { OpenTemplatePdfButton } from "@/components/awp-templates/open-template-pdf-button";
import { ReconvertTemplateButton } from "@/components/awp-templates/reconvert-template-button";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const PDF_PREVIEW_TTL_SECONDS = 60 * 60;

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await prisma.awpTemplate.findFirst({
    where: { id, deletedAt: null },
    include: {
      turbineModel: { select: { name: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });
  if (!template) notFound();

  const createdBy = template.createdBy.name ?? template.createdBy.email;

  const pdfUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: template.sourcePdfS3Key,
      ResponseContentDisposition: `inline; filename="${template.name.replace(/"/g, "")}.pdf"`,
    }),
    { expiresIn: PDF_PREVIEW_TTL_SECONDS },
  );

  const slotCount = Array.isArray(template.slotsJson)
    ? template.slotsJson.length
    : 0;

  return (
    <div className="flex flex-col gap-6 p-8">
      <Link
        href="/templates"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={2} />
        Templates
      </Link>

      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {template.name}
            </h1>
            {template.status === "CONVERTING" ? (
              <Badge variant="warning">
                <Loader2 className="size-3 animate-spin" strokeWidth={2} />
                Converting…
              </Badge>
            ) : template.status === "READY" ? (
              <Badge variant="success">Ready</Badge>
            ) : (
              <Badge variant="destructive">Failed</Badge>
            )}
            {template.status === "READY" ? (
              <Badge variant="muted">{slotCount} slots</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {[template.turbineModel?.name, template.jobType]
              .filter(Boolean)
              .join(" · ") || "Uncategorised"}{" "}
            · uploaded {dateFormatter.format(template.createdAt)} by {createdBy}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {template.status !== "CONVERTING" ? (
            <ReconvertTemplateButton templateId={template.id} />
          ) : null}
          <OpenTemplatePdfButton templateId={template.id} />
        </div>
      </div>

      {template.status === "FAILED" && template.conversionError ? (
        <div className="rounded-xl bg-destructive/5 p-4 text-sm text-destructive ring-1 ring-destructive/20">
          <p className="font-medium">Conversion failed</p>
          <p className="mt-1 text-destructive/80">{template.conversionError}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Source PDF</h2>
            <span className="text-xs text-muted-foreground">original</span>
          </div>
          <iframe
            src={pdfUrl}
            className="h-[80vh] w-full rounded-xl bg-white ring-1 ring-foreground/10"
            title="Source PDF"
          />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Converted preview</h2>
            <span className="text-xs text-muted-foreground">
              what the AI extracted
            </span>
          </div>
          {template.status === "READY" && template.templateHtml ? (
            <div className="h-[80vh] overflow-y-auto rounded-xl bg-neutral-200 p-4 ring-1 ring-foreground/10">
              {/* Style each `<section data-page>` chunk like an A4 page card. */}
              <style>{`
                .awp-preview .awp-page {
                  background: #ffffff;
                  color: #111111;
                  width: 100%;
                  max-width: 210mm;
                  min-height: 297mm;
                  margin: 0 auto 1.25rem;
                  padding: 18mm 15mm;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
                  border-radius: 4px;
                  overflow: hidden;
                }
                .awp-preview .awp-page table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 8px 0;
                  font-size: 12px;
                }
                .awp-preview .awp-page th,
                .awp-preview .awp-page td {
                  border: 1px solid #525252;
                  padding: 6px 8px;
                  vertical-align: top;
                  text-align: left;
                  word-wrap: break-word;
                }
                .awp-preview .awp-page p { margin: 6px 0; font-size: 13px; }
                .awp-preview .awp-page h1,
                .awp-preview .awp-page h2,
                .awp-preview .awp-page h3,
                .awp-preview .awp-page h4 { margin: 12px 0 8px; }
                .awp-preview .awp-page ul,
                .awp-preview .awp-page ol { margin: 6px 0 6px 20px; }
                /* Make slot spans visible so it's easy to see what got tagged. */
                .awp-preview .awp-page [data-slot] {
                  display: inline-block;
                  min-width: 140px;
                  min-height: 1.2em;
                  border-bottom: 1.5px dashed #2563eb;
                  background: rgba(37, 99, 235, 0.06);
                  padding: 0 4px;
                }
                .awp-preview .awp-page [data-slot]::before {
                  content: attr(data-label);
                  font-size: 10px;
                  color: #2563eb;
                  font-style: italic;
                  opacity: 0.8;
                }
              `}</style>
              <div
                className="awp-preview"
                dangerouslySetInnerHTML={{ __html: template.templateHtml }}
              />
            </div>
          ) : (
            <div className="flex h-[80vh] items-center justify-center rounded-xl text-sm text-muted-foreground ring-1 ring-foreground/10">
              {template.status === "CONVERTING"
                ? "Vision model is processing this template…"
                : "No HTML yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
