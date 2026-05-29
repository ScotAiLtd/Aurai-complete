"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

import { getDownloadUrl } from "@/lib/documents/actions";
import { Button } from "@/components/ui/button";

type Props = {
  documentId: string;
  fileName: string;
};

export function DownloadDocumentButton({ documentId, fileName }: Props) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = await getDownloadUrl(documentId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      onClick={onClick}
      disabled={isPending}
      aria-label={`Open ${fileName}`}
    >
      <ExternalLink className="size-4 text-muted-foreground" strokeWidth={2} />
    </Button>
  );
}
