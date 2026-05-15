"use client";

import {useTransition} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createSite } from "@/lib/sites/actions";
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

type FormValues = {
  name: string;
  portfolio: string;
  turbineMake: string;
  numberOfTurbines: string;
};

const DEFAULTS: FormValues = {
  name: "",
  portfolio: "",
  turbineMake: "",
  numberOfTurbines: "",
};

type Props = {
  onCancel: () => void;
  onSuccess: (id: string) => void;
};

export function MinimalSiteForm({ onCancel, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({ defaultValues: DEFAULTS });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createSite(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Site created.");
      onSuccess(result.id);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: "Site Name is required." }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Site Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="portfolio"
            rules={{ required: "Portfolio is required." }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Portfolio <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="turbineMake"
            rules={{ required: "Turbine Make is required." }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Turbine Make <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Vestas" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numberOfTurbines"
            rules={{
              required: "Number of Turbines is required.",
              validate: (v: string) => {
                const n = Number(v);
                return (
                  (Number.isInteger(n) && n >= 0) ||
                  "Must be a non-negative integer."
                );
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Number of Turbines{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          You can add additional details (capacity, dates, grid, etc.) later
          from the site&apos;s edit form.
        </p>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Site"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
