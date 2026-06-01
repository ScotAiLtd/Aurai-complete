"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import { reconvertTemplate } from "@/lib/awp-templates/actions";
import { Button } from "@/components/ui/button";

type Props = {
  templateId: string;
  label?: string;
};

export function ReconvertTemplateButton({
  templateId,
  label = "Re-run conversion",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = await reconvertTemplate(templateId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Conversion queued.");
      router.refresh();
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={isPending}
    >
      <RefreshCw
        className={`size-4 ${isPending ? "animate-spin" : ""}`}
        strokeWidth={2}
      />
      {isPending ? "Queuing…" : label}
    </Button>
  );
}
