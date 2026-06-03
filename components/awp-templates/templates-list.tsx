"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, FileText } from "lucide-react";

import { getTemplatePdfUrl } from "@/lib/awp-templates/actions";
import { Button } from "@/components/ui/button";
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
  turbineModelName: string | null;
  jobType: string | null;
  createdAt: Date;
  createdBy: string;
};

type Props = { templates: TemplateListItem[] };

export function TemplatesList({ templates }: Props) {
  if (templates.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl bg-card text-sm text-muted-foreground ring-1 ring-foreground/10">
        No templates yet. Upload an AWP template PDF to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {templates.map((t) => (
        <TemplateRow key={t.id} template={t} />
      ))}
    </div>
  );
}

function TemplateRow({ template: t }: { template: TemplateListItem }) {
  const [isPending, startTransition] = useTransition();

  const openPdf = () => {
    startTransition(async () => {
      const result = await getTemplatePdfUrl(t.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <div className="flex items-center gap-4 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/30">
      <FileText
        className="size-5 shrink-0 text-muted-foreground"
        strokeWidth={2}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{t.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {[t.turbineModelName, t.jobType].filter(Boolean).join(" · ") ||
            "Uncategorised"}{" "}
          · uploaded {dateFormatter.format(t.createdAt)} by {t.createdBy}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={openPdf}
              disabled={isPending}
              aria-label="Open template PDF"
            >
              <ExternalLink
                className="size-4 text-muted-foreground"
                strokeWidth={2}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Open PDF</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DeleteTemplateDialog templateId={t.id} templateName={t.name} />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">Delete template</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
