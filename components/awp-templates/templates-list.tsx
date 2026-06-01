"use client";

import Link from "next/link";
import { ExternalLink, FileText, Loader2 } from "lucide-react";

import { AwpTemplateStatus } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteTemplateDialog } from "@/components/awp-templates/delete-template-dialog";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export type TemplateListItem = {
  id: string;
  name: string;
  status: AwpTemplateStatus;
  conversionError: string | null;
  turbineModelName: string | null;
  jobType: string | null;
  createdAt: Date;
  createdBy: string;
};

type Props = { templates: TemplateListItem[] };

function StatusBadge({
  status,
  error,
}: {
  status: AwpTemplateStatus;
  error: string | null;
}) {
  if (status === "CONVERTING") {
    return (
      <Badge variant="warning">
        <Loader2 className="size-3 animate-spin" strokeWidth={2} />
        Converting…
      </Badge>
    );
  }
  if (status === "READY") {
    return <Badge variant="success">Ready</Badge>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="destructive" className="cursor-default">
          Failed
        </Badge>
      </TooltipTrigger>
      {error ? (
        <TooltipContent side="bottom" className="max-w-sm">
          {error}
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}

export function TemplatesList({ templates }: Props) {
  if (templates.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl bg-card text-sm text-muted-foreground ring-1 ring-foreground/10">
        No templates yet. Upload a blank AWP form to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {templates.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-4 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/30"
        >
          <FileText
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={2}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Link
                href={`/templates/${t.id}`}
                className="truncate text-sm font-medium hover:underline"
              >
                {t.name}
              </Link>
              <StatusBadge status={t.status} error={t.conversionError} />
            </div>
            <span className="truncate text-xs text-muted-foreground">
              {[t.turbineModelName, t.jobType].filter(Boolean).join(" · ") ||
                "Uncategorised"}{" "}
              · uploaded {dateFormatter.format(t.createdAt)} by {t.createdBy}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/templates/${t.id}`}
                  aria-label="Open template"
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="size-4" strokeWidth={2} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">Open template</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <DeleteTemplateDialog
                    templateId={t.id}
                    templateName={t.name}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">Delete template</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}
