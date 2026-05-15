"use client";

import {useState} from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SiteForm,
  type SiteFormValues,
} from "@/components/sites/site-form";

type EditSiteDialogProps = {
  siteId: string;
  defaultValues: SiteFormValues;
};

export function EditSiteDialog({ siteId, defaultValues }: EditSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="size-4" strokeWidth={2} />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Edit Site</DialogTitle>
          <DialogDescription>
            Update site information. Required fields are marked with an asterisk.
          </DialogDescription>
        </DialogHeader>
        <SiteForm
          mode="edit"
          siteId={siteId}
          defaultValues={defaultValues}
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
