"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

import { getTemplatePdfUrl } from "@/lib/awp-templates/actions";
import { Button } from "@/components/ui/button";

type Props = { templateId: string };

export function OpenTemplatePdfButton({ templateId }: Props) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = await getTemplatePdfUrl(templateId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={isPending}>
      <ExternalLink className="size-4" strokeWidth={2} />
      View Source PDF
    </Button>
  );
}
