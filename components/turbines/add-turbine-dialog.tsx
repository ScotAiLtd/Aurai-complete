"use client";

import { useState } from "react";
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
import { TurbineForm } from "@/components/turbines/turbine-form";
import type { TurbineModelOption } from "@/components/turbines/turbine-model-picker";

type Props = {
  siteId: string;
  turbineModels: TurbineModelOption[];
};

export function AddTurbineDialog({ siteId, turbineModels }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" strokeWidth={2} />
          Add Turbine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Turbine</DialogTitle>
          <DialogDescription>
            Required fields are marked with an asterisk.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <TurbineForm
            mode="create"
            siteId={siteId}
            turbineModels={turbineModels}
            onCancel={() => setOpen(false)}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
