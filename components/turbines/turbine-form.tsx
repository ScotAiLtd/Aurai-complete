"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";

import { TurbineStatus } from "@/app/generated/prisma/enums";
import { createTurbine, updateTurbine } from "@/lib/turbines/actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TurbineFormValues = {
  name: string;
  type: string;
  serial: string;
  status: TurbineStatus;
};

export const EMPTY_TURBINE_FORM: TurbineFormValues = {
  name: "",
  type: "",
  serial: "",
  status: TurbineStatus.WORKING,
};

const STATUS_OPTIONS: { value: TurbineStatus; label: string }[] = [
  { value: TurbineStatus.WORKING, label: "Working" },
  { value: TurbineStatus.IN_USE, label: "In Use" },
  { value: TurbineStatus.SUSPENDED, label: "Suspended" },
  { value: TurbineStatus.NOT_OPERATIONAL, label: "Not Operational" },
];

type TurbineFormProps = (
  | { mode: "create"; siteId: string; turbineId?: never }
  | { mode: "edit"; siteId: string; turbineId: string }
) & {
  defaultValues?: TurbineFormValues;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function TurbineForm({
  mode,
  siteId,
  turbineId,
  defaultValues,
  onCancel,
  onSuccess,
}: TurbineFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<TurbineFormValues>({
    defaultValues: defaultValues ?? EMPTY_TURBINE_FORM,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTurbine(siteId, values)
          : await updateTurbine(turbineId!, siteId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(mode === "create" ? "Turbine added." : "Turbine updated.");
      onSuccess?.();
      router.refresh();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Turbine number is required." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Turbine Number <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. T01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Vestas V112-3.45 MW" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serial Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Status <span className="text-destructive">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => (onCancel ? onCancel() : router.back())}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? mode === "create"
                ? "Adding…"
                : "Saving…"
              : mode === "create"
                ? "Add Turbine"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
