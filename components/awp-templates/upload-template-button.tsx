"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, FileText, Plus, Upload, X } from "lucide-react";
import axios from "axios";

import { getTemplateUploadUrl, recordTemplate } from "@/lib/awp-templates/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TurbineModelPicker,
  type TurbineModelOption,
} from "@/components/turbines/turbine-model-picker";

type Props = {
  turbineModels: TurbineModelOption[];
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

export function UploadTemplateButton({ turbineModels }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [showCategorisation, setShowCategorisation] = useState(false);
  const [turbineModelId, setTurbineModelId] = useState("");
  const [jobType, setJobType] = useState("");
  const [models, setModels] = useState<TurbineModelOption[]>(turbineModels);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setFile(null);
    setName("");
    setShowCategorisation(false);
    setTurbineModelId("");
    setJobType("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSubmit = () => {
    if (!file) {
      toast.error("Choose a PDF first.");
      return;
    }
    if (!name.trim()) {
      toast.error("Give the template a name.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are allowed.");
      return;
    }

    const toastId = toast.loading(`Uploading ${file.name}…`);
    startTransition(async () => {
      try {
        const presign = await getTemplateUploadUrl({
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
        const record = await recordTemplate({
          name: name.trim(),
          fileName: file.name,
          sizeBytes: file.size,
          s3Key: presign.s3Key,
          turbineModelId: turbineModelId || undefined,
          jobType: jobType.trim() || undefined,
        });
        if (!record.ok) {
          toast.error(record.error, { id: toastId });
          return;
        }
        toast.success(`Template uploaded — conversion queued.`, { id: toastId });
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
          Upload Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload AWP Template</DialogTitle>
          <DialogDescription>
            Upload a <span className="font-medium text-foreground">blank</span>{" "}
            AWP form. We&apos;ll convert it to HTML and auto-detect the fillable
            fields.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tpl-name">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tpl-name"
              placeholder="e.g. AWP 4.0 — V52 850KW Blade & External Tower Repair"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              maxLength={160}
            />
          </div>

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
            <button
              type="button"
              onClick={() => setShowCategorisation((s) => !s)}
              className="flex items-center gap-1 self-start text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDown
                className={`size-3.5 transition-transform ${showCategorisation ? "rotate-0" : "-rotate-90"}`}
                strokeWidth={2}
              />
              Categorisation (optional)
            </button>
            {showCategorisation ? (
              <div className="flex flex-col gap-4 rounded-xl bg-muted/30 p-4">
                <div className="flex flex-col gap-2">
                  <Label>Turbine Model</Label>
                  <TurbineModelPicker
                    value={turbineModelId}
                    onChange={setTurbineModelId}
                    models={models}
                    onModelCreated={(m) =>
                      setModels((prev) =>
                        prev.some((p) => p.id === m.id)
                          ? prev
                          : [...prev, m].sort((a, b) =>
                              a.name.localeCompare(b.name),
                            ),
                      )
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tpl-job">Job Type</Label>
                  <Input
                    id="tpl-job"
                    placeholder="e.g. blade-repair"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    disabled={isPending}
                    maxLength={120}
                  />
                </div>
              </div>
            ) : null}
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
