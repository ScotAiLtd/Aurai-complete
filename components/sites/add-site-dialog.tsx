"use client";

import {useState} from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MinimalSiteForm } from "@/components/sites/minimal-site-form";

export function AddSiteDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" strokeWidth={2} />
          Add Site
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Site</DialogTitle>
          <DialogDescription>
            Enter the basics to get started. You can fill in the rest later.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <MinimalSiteForm
            onCancel={() => setOpen(false)}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
