"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  markDocumentReadyForAwp,
  revokeAwpReadyStatus,
} from "@/lib/documents/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Common = {
  siteId: string;
  documentId: string;
  fileName: string;
  trigger?: React.ReactNode;
};

export function MarkReadyForAwpDialog({
  siteId,
  documentId,
  fileName,
  trigger,
}: Common) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await markDocumentReadyForAwp(documentId, siteId, {
        note: note.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${fileName} is now ready for AWP.`);
      setOpen(false);
      setNote("");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <ShieldCheck className="size-4" strokeWidth={2} />
            Mark Ready for AWP
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Mark this document ready for AWP
          </DialogTitle>
          <DialogDescription>
            Confirms{" "}
            <span className="font-medium text-foreground">{fileName}</span> can
            be used as a source for AWP generation on this site.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 flex flex-col gap-2 rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
          <p>By marking ready, you confirm:</p>
          <ul className="list-disc pl-4">
            <li>The audit is complete and all open issues have been addressed.</li>
            <li>The content reflects the current revision in use on site.</li>
            <li>You accept accountability for its inclusion in generated AWPs.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="awp-ready-note">Note (optional)</Label>
          <Input
            id="awp-ready-note"
            placeholder="e.g. Reviewed against site addendum 2026-05"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending}
            maxLength={500}
          />
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? "Marking…" : "Mark Ready"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RevokeAwpReadyButton({
  siteId,
  documentId,
  fileName,
  trigger,
}: Common) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      const result = await revokeAwpReadyStatus(documentId, siteId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Revoked AWP readiness for ${fileName}.`);
      router.refresh();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" disabled={isPending}>
            Revoke
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">
            Revoke AWP readiness?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Any AWPs that depend on{" "}
            <span className="font-medium text-foreground">{fileName}</span> will
            be flagged as stale until you regenerate them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
          >
            {isPending ? "Revoking…" : "Revoke"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
