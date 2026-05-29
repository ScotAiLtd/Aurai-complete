"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { getUploadUrl, recordDocument } from "@/lib/documents/actions";

type Props = { siteId: string };

async function putWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  await axios.put(url, file, {
    headers: {
      "Content-Type": "application/pdf",
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const pct = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100,
        );
        onProgress(pct);
      }
    },
  });
}

export function UploadDocumentButton({ siteId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are allowed.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}…`);

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
      });
      if (!record.ok) {
        toast.error(record.error, { id: toastId });
        return;
      }

      toast.success(`Uploaded ${file.name}.`, { id: toastId });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      toast.error(message, { id: toastId });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <Plus className="size-4" strokeWidth={2} />
        {uploading ? "Adding…" : "Add Document"}
      </Button>
    </>
  );
}
