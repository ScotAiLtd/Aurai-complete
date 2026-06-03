"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Plus, Upload, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  siteId: string;
  defaultDocType?: DocType;
};

const DOC_TYPE_OPTIONS: { value: DocType; label: string; hint: string }[] = [
  {
    value: DocType.AWP_SOURCE,
    label: "AWP Source",
    hint: "OEM manuals, RAs, MS — eligible for AWP generation",
  },
  {
    value: DocType.REPORT,
    label: "Report",
    hint: "Inspection, incident, maintenance",
  },
  {
    value: DocType.REFERENCE,
    label: "Reference",
    hint: "Site policy, training, drawings",
  },
  { value: DocType.OTHER, label: "Other", hint: "Catch all" },
];

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

export function UploadDocumentButton({ siteId, defaultDocType }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType | "">(defaultDocType ?? "");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setFile(null);
    setDocType(defaultDocType ?? "");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSubmit = () => {
    if (!file) {
      toast.error("Choose a PDF first.");
      return;
    }
    if (!docType) {
      toast.error("Pick a document type.");
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
        });
        if (!record.ok) {
          toast.error(record.error, { id: toastId });
          return;
        }

        toast.success(`Uploaded ${file.name}.`, { id: toastId });
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
        <Button size="sm">
          <Plus className="size-4" strokeWidth={2} />
          Add Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
          <DialogDescription>
            Upload a PDF and pick the document type so we know where it belongs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
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
              <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 ring-1 ring-foreground/10">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText
                    className="size-5 shrink-0 text-muted-foreground"
                    strokeWidth={2}
                  />
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
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isPending}
                className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-foreground/15 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
              >
                <Upload className="size-5" strokeWidth={2} />
                <span>Click to choose a PDF</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>
              Document Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={docType}
              onValueChange={(v) => setDocType(v as DocType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type">
                  {docType
                    ? DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.label
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {opt.hint}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
