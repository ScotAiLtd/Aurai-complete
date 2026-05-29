import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteDocumentDialog } from "@/components/documents/delete-document-dialog";
import { DownloadDocumentButton } from "@/components/documents/download-document-button";
import { AuditDocumentDialog } from "@/components/documents/audit-document-dialog";
import { AuditResultsDialog } from "@/components/documents/audit-results-dialog";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

export type DocumentListItem = {
  id: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: Date;
  latestAudit: {
    id: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
    issuesFound: number;
    openIssues: number;
  } | null;
};

type Props = {
  siteId: string;
  documents: DocumentListItem[];
};

function AuditCell({
  doc,
  siteId,
}: {
  doc: DocumentListItem;
  siteId: string;
}) {
  const a = doc.latestAudit;

  if (!a || a.status === "FAILED") {
    return (
      <div className="flex items-center gap-2">
        {a?.status === "FAILED" ? (
          <Badge variant="destructive">Audit failed</Badge>
        ) : null}
        <AuditDocumentDialog
          documentId={doc.id}
          fileName={doc.fileName}
          trigger={
            <Button size="sm" variant="outline">
              {a?.status === "FAILED" ? "Retry" : "Audit"}
            </Button>
          }
        />
      </div>
    );
  }

  if (a.status === "PENDING" || a.status === "IN_PROGRESS") {
    return <Badge variant="warning">Auditing…</Badge>;
  }

  // COMPLETED
  return (
    <div className="flex items-center gap-2">
      {a.openIssues === 0 ? (
        <Badge variant="success">Audited</Badge>
      ) : (
        <Badge variant="warning">{a.openIssues} open</Badge>
      )}
      <AuditResultsDialog
        auditId={a.id}
        siteId={siteId}
        fileName={doc.fileName}
        trigger={
          <Button size="sm" variant="outline">
            Results
          </Button>
        }
      />
    </div>
  );
}

export function DocumentsList({ siteId, documents }: Props) {
  if (documents.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl text-sm text-muted-foreground ring-1 ring-foreground/10">
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl ring-1 ring-foreground/10">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center gap-4 px-4 py-3">
          <FileText
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={2}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{doc.fileName}</span>
            <span className="text-xs text-muted-foreground">
              {formatBytes(doc.sizeBytes)} ·{" "}
              {dateFormatter.format(doc.uploadedAt)}
            </span>
          </div>
          <AuditCell doc={doc} siteId={siteId} />
          <div className="flex items-center gap-0.5">
            <DownloadDocumentButton
              documentId={doc.id}
              fileName={doc.fileName}
            />
            <DeleteDocumentDialog
              siteId={siteId}
              documentId={doc.id}
              fileName={doc.fileName}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
