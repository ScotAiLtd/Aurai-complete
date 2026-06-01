"use client";

import { useMemo, useState } from "react";
import {
  FileSearch,
  FileText,
  FileUp,
  Info,
  ListChecks,
  ShieldCheck,
  Undo2,
} from "lucide-react";

import { DocType } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteDocumentDialog } from "@/components/documents/delete-document-dialog";
import { DownloadDocumentButton } from "@/components/documents/download-document-button";
import { AuditDocumentDialog } from "@/components/documents/audit-document-dialog";
import { AuditResultsDialog } from "@/components/documents/audit-results-dialog";
import {
  MarkReadyForAwpDialog,
  RevokeAwpReadyButton,
} from "@/components/documents/awp-ready-controls";
import { UploadCorrectedVersionButton } from "@/components/documents/upload-corrected-version-button";

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
  docType: DocType;
  version: number;
  markedReadyForAwpAt: Date | null;
  markedReadyForAwpNote: string | null;
  markedReadyForAwpBy: string | null;
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

type TabKey = "all" | "awp" | "reports" | "reference" | "other";

const TAB_LABELS: Record<TabKey, string> = {
  all: "All",
  awp: "AWP",
  reports: "Reports",
  reference: "Reference",
  other: "Other",
};

const TAB_DOCTYPE: Record<Exclude<TabKey, "all">, DocType> = {
  awp: DocType.AWP_SOURCE,
  reports: DocType.REPORT,
  reference: DocType.REFERENCE,
  other: DocType.OTHER,
};

function IconButton({
  label,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={label}
          className={className}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

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
            <IconButton label={a?.status === "FAILED" ? "Retry audit" : "Run audit"}>
              <FileSearch className="size-4" strokeWidth={2} />
            </IconButton>
          }
        />
      </div>
    );
  }

  if (a.status === "PENDING" || a.status === "IN_PROGRESS") {
    return <Badge variant="warning">Auditing…</Badge>;
  }

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
          <IconButton label="View audit results">
            <ListChecks className="size-4" strokeWidth={2} />
          </IconButton>
        }
      />
    </div>
  );
}

function DocumentRow({
  doc,
  siteId,
  showAwpControls,
}: {
  doc: DocumentListItem;
  siteId: string;
  showAwpControls: boolean;
}) {
  const auditCompleted =
    doc.latestAudit?.status === "COMPLETED" && doc.latestAudit.openIssues === 0;
  const canMarkReady = showAwpControls && auditCompleted && !doc.markedReadyForAwpAt;
  const hasOpenAudit =
    doc.latestAudit?.status === "COMPLETED" && doc.latestAudit.openIssues > 0;

  return (
    <div className="flex items-center gap-4 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/30">
      <FileText className="size-5 shrink-0 text-muted-foreground" strokeWidth={2} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{doc.fileName}</span>
          {doc.version > 1 ? (
            <Badge variant="muted">v{doc.version}</Badge>
          ) : null}
          {showAwpControls && doc.markedReadyForAwpAt ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="success" className="cursor-default">
                  Ready for AWP
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm">
                Marked ready on{" "}
                {dateFormatter.format(doc.markedReadyForAwpAt)}
                {doc.markedReadyForAwpBy ? ` by ${doc.markedReadyForAwpBy}` : ""}
                {doc.markedReadyForAwpNote
                  ? ` — ${doc.markedReadyForAwpNote}`
                  : ""}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatBytes(doc.sizeBytes)} · {dateFormatter.format(doc.uploadedAt)}
        </span>
      </div>
      <AuditCell doc={doc} siteId={siteId} />
      <div className="flex items-center gap-0.5">
        {showAwpControls && canMarkReady ? (
          <MarkReadyForAwpDialog
            siteId={siteId}
            documentId={doc.id}
            fileName={doc.fileName}
            trigger={
              <IconButton label="Mark ready for AWP">
                <ShieldCheck className="size-4" strokeWidth={2} />
              </IconButton>
            }
          />
        ) : null}
        {showAwpControls && doc.markedReadyForAwpAt ? (
          <RevokeAwpReadyButton
            siteId={siteId}
            documentId={doc.id}
            fileName={doc.fileName}
            trigger={
              <IconButton label="Revoke AWP readiness">
                <Undo2 className="size-4" strokeWidth={2} />
              </IconButton>
            }
          />
        ) : null}
        {hasOpenAudit ? (
          <UploadCorrectedVersionButton
            siteId={siteId}
            documentId={doc.id}
            docType={doc.docType}
            trigger={
              <IconButton label="Upload corrected version">
                <FileUp className="size-4" strokeWidth={2} />
              </IconButton>
            }
          />
        ) : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DownloadDocumentButton documentId={doc.id} fileName={doc.fileName} />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">Open document</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DeleteDocumentDialog
                siteId={siteId}
                documentId={doc.id}
                fileName={doc.fileName}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">Delete document</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl text-sm text-muted-foreground ring-1 ring-foreground/10">
      {label}
    </div>
  );
}

export function DocumentsList({ siteId, documents }: Props) {
  const [tab, setTab] = useState<TabKey>("all");

  const grouped = useMemo(() => {
    const byTab: Record<TabKey, DocumentListItem[]> = {
      all: documents,
      awp: documents.filter((d) => d.docType === DocType.AWP_SOURCE),
      reports: documents.filter((d) => d.docType === DocType.REPORT),
      reference: documents.filter((d) => d.docType === DocType.REFERENCE),
      other: documents.filter((d) => d.docType === DocType.OTHER),
    };
    return byTab;
  }, [documents]);

  const tabs: TabKey[] = ["all", "awp", "reports", "reference", "other"];

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
      <TabsList className="bg-muted/40 ring-0 shadow-none">
        {tabs.map((key) => (
          <TabsTrigger key={key} value={key}>
            {TAB_LABELS[key]}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {grouped[key].length}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((key) => {
        const list = grouped[key];
        const showAwpControls = key === "awp";
        return (
          <TabsContent key={key} value={key} className="mt-4">
            {key === "awp" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="size-3.5" strokeWidth={2} />
                    <span>
                      Only documents marked{" "}
                      <span className="font-medium">Ready for AWP</span> are used
                      when generating procedures.
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  Mark a document ready once its audit is complete and all open
                  issues are resolved or dismissed.
                </TooltipContent>
              </Tooltip>
            ) : null}
            {list.length === 0 ? (
              <EmptyState
                label={
                  key === "all"
                    ? "No documents uploaded yet."
                    : `No ${TAB_LABELS[key]} documents yet.`
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {list.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    siteId={siteId}
                    showAwpControls={
                      showAwpControls ||
                      (key === "all" && doc.docType === DocType.AWP_SOURCE)
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

export { TAB_DOCTYPE };
