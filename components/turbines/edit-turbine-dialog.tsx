"use client";

import { useState } from "react";
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
  TurbineForm,
  type TurbineFormValues,
} from "@/components/turbines/turbine-form";
import type { TurbineModelOption } from "@/components/turbines/turbine-model-picker";

type EditTurbineDialogProps = {
  siteId: string;
  turbineId: string;
  defaultValues: TurbineFormValues;
  turbineModels: TurbineModelOption[];
};

export function EditTurbineDialog({
  siteId,
  turbineId,
  defaultValues,
  turbineModels,
}: EditTurbineDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Edit ${defaultValues.name}`}
        >
          <Pencil className="size-4" strokeWidth={2} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Turbine</DialogTitle>
          <DialogDescription>Update turbine information.</DialogDescription>
        </DialogHeader>
        {open ? (
          <TurbineForm
            mode="edit"
            siteId={siteId}
            turbineId={turbineId}
            defaultValues={defaultValues}
            turbineModels={turbineModels}
            onCancel={() => setOpen(false)}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
