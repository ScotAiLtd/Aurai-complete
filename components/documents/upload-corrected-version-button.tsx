"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, FileUp, Upload, X } from "lucide-react";
import axios from "axios";

import { DocType } from "@/app/generated/prisma/enums";
import { getUploadUrl, recordDocument } from "@/lib/documents/actions";
import { Button } from "@/components/ui/button";
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

type Props = {
  siteId: string;
  documentId: string;
  docType: DocType;
  trigger?: React.ReactNode;
};

async function putWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  await axios.put(url, file, {
    headers: { "Content-Type": "application/pdf" },
    onUploadProgress: (e) => {
      if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
}

export function UploadCorrectedVersionButton({
  siteId,
  documentId,
  docType,
  trigger,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSubmit = () => {
    if (!file) {
      toast.error("Choose a PDF first.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are allowed.");
      return;
    }

    const toastId = toast.loading(`Uploading ${file.name}…`);
    startTransition(async () => {
      try {
        const presign = await getUploadUrl(siteId, {
          fileName: file.name,
          sizeBytes: file.size,
        });
        if (!presign.ok) {
          toast.error(presign.error, { id: toastId });
          return;
        }
        await putWithProgress(presign.uploadUrl, file, (pct) => {
          toast.loading(`Uploading ${file.name} — ${pct}%`, { id: toastId });
        });
        const record = await recordDocument(siteId, {
          fileName: file.name,
          sizeBytes: file.size,
          s3Key: presign.s3Key,
          docType,
          previousVersionId: documentId,
        });
        if (!record.ok) {
          toast.error(record.error, { id: toastId });
          return;
        }
        toast.success(`Corrected version uploaded.`, { id: toastId });
        reset();
        setOpen(false);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        toast.error(message, { id: toastId });
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <FileUp className="size-4" strokeWidth={2} />
            Upload Corrected
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Corrected Version</DialogTitle>
          <DialogDescription>
            Upload a revised PDF that resolves the issues found in the audit.
            The new version is linked to the original.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>
            File <span className="text-destructive">*</span>
          </Label>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />
          {file ? (
            <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 ring-1 ring-foreground/10">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                <span className="truncate text-sm">{file.name}</span>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setFile(null)}
                disabled={isPending}
                aria-label="Remove file"
              >
                <X className="size-4" strokeWidth={2} />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isPending}
            >
              <Upload className="size-4" strokeWidth={2} />
              Choose PDF
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isPending}>
            {isPending ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
