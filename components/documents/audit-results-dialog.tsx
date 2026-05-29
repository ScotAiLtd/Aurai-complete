"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

import {
  getAuditDetail,
  updateIssueStatus,
  type AuditDetail,
  type AuditIssueItem,
} from "@/lib/audits/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "technical_error", label: "Technical Errors" },
  { key: "language_issue", label: "Language Issues" },
  { key: "structural_problem", label: "Structural Problems" },
  { key: "consistency_conflict", label: "Consistency Conflicts" },
  { key: "compliance_violation", label: "Compliance Violations" },
  { key: "visual_content_issue", label: "Visual Content Issues" },
  { key: "custom_analysis", label: "Custom Analysis" },
] as const;

type Severity = AuditIssueItem["severity"];
type IssueStatus = AuditIssueItem["status"];

const SEVERITY_VARIANT: Record<Severity, "destructive" | "warning" | "muted"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "muted",
};
const SEVERITY_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function fmtDuration(s: number | null): string {
  if (s === null) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold",
          accent ? "text-xl leading-tight" : "text-sm",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function IssueCard({
  issue,
  onSetStatus,
  isPending,
}: {
  issue: AuditIssueItem;
  onSetStatus: (id: string, status: IssueStatus) => void;
  isPending: boolean;
}) {
  const location = [
    issue.pageNumber !== null ? `Page ${issue.pageNumber}` : null,
    issue.section,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-muted/30 p-3 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={SEVERITY_VARIANT[issue.severity]}
            className="rounded-sm"
          >
            {issue.severity}
          </Badge>
          <span className="text-sm font-medium">{issue.title}</span>
          {issue.status !== "OPEN" ? (
            <Badge
              variant={issue.status === "RESOLVED" ? "success" : "muted"}
              className="rounded-sm"
            >
              {issue.status === "RESOLVED" ? "Resolved" : "Dismissed"}
            </Badge>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1.5">
          {issue.status === "OPEN" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onSetStatus(issue.id, "RESOLVED")}
              >
                Resolve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onSetStatus(issue.id, "DISMISSED")}
              >
                Dismiss
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => onSetStatus(issue.id, "OPEN")}
            >
              Reopen
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{issue.description}</p>
      {location ? (
        <p className="text-xs text-muted-foreground">Location: {location}</p>
      ) : null}
      {issue.suggestion ? (
        <div className="rounded-md bg-primary/5 px-3 py-2 text-xs ring-1 ring-foreground/10">
          <span className="font-medium">Suggestion: </span>
          {issue.suggestion}
        </div>
      ) : null}
    </div>
  );
}

function CategorySection({
  label,
  issues,
  open,
  onToggle,
  onSetStatus,
  isPending,
}: {
  label: string;
  issues: AuditIssueItem[];
  open: boolean;
  onToggle: () => void;
  onSetStatus: (id: string, status: IssueStatus) => void;
  isPending: boolean;
}) {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  for (const i of issues) counts[i.severity] += 1;

  return (
    <div className="rounded-xl ring-1 ring-foreground/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            !open && "-rotate-90",
          )}
          strokeWidth={2}
        />
        <span className="text-sm font-medium">{label}</span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium">
          {issues.length}
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {SEVERITY_ORDER.map((sev) =>
            counts[sev] > 0 ? (
              <Badge
                key={sev}
                variant={SEVERITY_VARIANT[sev]}
                className="rounded-sm"
              >
                {counts[sev]} {sev.toLowerCase()}
              </Badge>
            ) : null,
          )}
        </div>
      </button>
      {open ? (
        <div className="border-t border-foreground/10 p-3">
          {issues.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">
              No issues in this category.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onSetStatus={onSetStatus}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AuditResultsDialog({
  auditId,
  siteId,
  fileName,
  trigger,
}: {
  auditId: string;
  siteId: string;
  fileName: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && detail === null && !loading) {
      setLoading(true);
      void getAuditDetail(auditId).then((result) => {
        setLoading(false);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setDetail(result.detail);
        const firstNonEmpty = CATEGORIES.find((c) =>
          result.detail.issues.some((i) => i.issueType === c.key),
        );
        if (firstNonEmpty) setExpanded(new Set([firstNonEmpty.key]));
      });
    }
  };

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const setStatus = (issueId: string, status: IssueStatus) => {
    startTransition(async () => {
      const result = await updateIssueStatus(issueId, status, siteId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              issues: prev.issues.map((i) =>
                i.id === issueId ? { ...i, status } : i,
              ),
            }
          : prev,
      );
      router.refresh();
    });
  };

  const issues = detail?.issues ?? [];
  const resolvedCount = issues.filter((i) => i.status === "RESOLVED").length;
  const dismissedCount = issues.filter((i) => i.status === "DISMISSED").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Audit results</DialogTitle>
          <DialogDescription className="truncate">{fileName}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Loading results…
          </div>
        ) : !detail ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No data.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-5 gap-4 rounded-xl bg-muted/40 px-5 py-3">
              <Stat
                label="Status"
                value={
                  detail.status.charAt(0) +
                  detail.status.slice(1).toLowerCase().replace("_", " ")
                }
              />
              <Stat
                label="Issues Found"
                value={String(detail.issuesFound)}
                accent
              />
              <Stat label="Resolved" value={String(resolvedCount)} />
              <Stat label="Dismissed" value={String(dismissedCount)} />
              <Stat
                label="Processing Time"
                value={fmtDuration(detail.processingSeconds)}
              />
            </div>

            <div className="flex h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => {
                const catIssues = issues.filter(
                  (i) => i.issueType === cat.key,
                );
                if (cat.key === "custom_analysis" && catIssues.length === 0) {
                  return null;
                }
                return (
                  <CategorySection
                    key={cat.key}
                    label={cat.label}
                    issues={catIssues}
                    open={expanded.has(cat.key)}
                    onToggle={() => toggle(cat.key)}
                    onSetStatus={setStatus}
                    isPending={isPending}
                  />
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
