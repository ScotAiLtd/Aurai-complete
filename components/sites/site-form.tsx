"use client";

import {useTransition} from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createSite, updateSite } from "@/lib/sites/actions";
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

export type SiteFormValues = {
  name: string;
  portfolio: string;
  spv: string;
  oAndMProvider: string;
  numberOfTurbines: string;
  turbineMake: string;
  technology: string;
  totalCapacityMw: string;
  commissioningDate: string;
  operationalSince: string;
  assetManager: string;
  turbineOem: string;
  turbineModel: string;
  turbineRating: string;
  projectStatus: string;
  lifeExpectancy: string;
  lifeExtension: string;
  gridConnectionType: string;
  dno: string;
  hubHeight: string;
  rotorDiameter: string;
};

export const EMPTY_SITE_FORM: SiteFormValues = {
  name: "",
  portfolio: "",
  spv: "",
  oAndMProvider: "",
  numberOfTurbines: "",
  turbineMake: "",
  technology: "",
  totalCapacityMw: "",
  commissioningDate: "",
  operationalSince: "",
  assetManager: "",
  turbineOem: "",
  turbineModel: "",
  turbineRating: "",
  projectStatus: "",
  lifeExpectancy: "",
  lifeExtension: "",
  gridConnectionType: "",
  dno: "",
  hubHeight: "",
  rotorDiameter: "",
};

type SiteFormProps = (
  | { mode: "create"; siteId?: never; defaultValues?: SiteFormValues }
  | { mode: "edit"; siteId: string; defaultValues: SiteFormValues }
) & {
  onCancel?: () => void;
  onSuccess?: (id: string) => void;
};

export function SiteForm({
  mode,
  siteId,
  defaultValues,
  onCancel,
  onSuccess,
}: SiteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SiteFormValues>({
    defaultValues: defaultValues ?? EMPTY_SITE_FORM,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const action =
        mode === "create"
          ? createSite(values)
          : updateSite(siteId!, values);
      const result = await action;
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(mode === "create" ? "Site created." : "Site updated.");
      if (onSuccess) {
        onSuccess(result.id);
      } else {
        router.push(`/sites/${result.id}`);
      }
      router.refresh();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Section title="Basics">
          <TextField
            name="name"
            label="Site Name"
            required
            rules={{ required: "Site Name is required." }}
            form={form}
          />
          <TextField
            name="portfolio"
            label="Portfolio"
            required
            rules={{ required: "Portfolio is required." }}
            form={form}
          />
          <TextField
            name="turbineMake"
            label="Turbine Make"
            required
            rules={{ required: "Turbine Make is required." }}
            form={form}
          />
          <TextField
            name="numberOfTurbines"
            label="Number of Turbines"
            type="number"
            required
            rules={{
              required: "Number of Turbines is required.",
              validate: (v: string) => {
                const n = Number(v);
                return (Number.isInteger(n) && n >= 0) ||
                  "Must be a non-negative integer.";
              },
            }}
            form={form}
          />
          <TextField name="spv" label="SPV" form={form} />
          <TextField
            name="oAndMProvider"
            label="O&M Provider"
            form={form}
          />
        </Section>

        <Section title="Operations">
          <TextField name="technology" label="Technology" form={form} />
          <TextField
            name="totalCapacityMw"
            label="Total Capacity (MW)"
            type="number"
            step="0.01"
            form={form}
          />
          <TextField name="assetManager" label="Asset Manager" form={form} />
          <TextField name="projectStatus" label="Project Status" form={form} />
          <TextField
            name="commissioningDate"
            label="Commissioning Date"
            type="date"
            form={form}
          />
          <TextField
            name="operationalSince"
            label="Operational Since"
            type="date"
            form={form}
          />
          <TextField
            name="lifeExpectancy"
            label="Life Expectancy (years)"
            type="number"
            form={form}
          />
          <TextField
            name="lifeExtension"
            label="Life Extension (years)"
            type="number"
            form={form}
          />
        </Section>

        <Section title="Turbine Specs">
          <TextField name="turbineOem" label="Turbine OEM" form={form} />
          <TextField name="turbineModel" label="Turbine Model" form={form} />
          <TextField
            name="turbineRating"
            label="Turbine Rating (MW)"
            type="number"
            step="0.01"
            form={form}
          />
          <TextField
            name="hubHeight"
            label="Hub Height (m)"
            type="number"
            step="0.01"
            form={form}
          />
          <TextField
            name="rotorDiameter"
            label="Rotor Diameter (m)"
            type="number"
            step="0.01"
            form={form}
          />
        </Section>

        <Section title="Grid">
          <TextField
            name="gridConnectionType"
            label="Grid Connection Type"
            form={form}
          />
          <TextField name="dno" label="DNO" form={form} />
        </Section>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
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
                ? "Creating…"
                : "Saving…"
              : mode === "create"
                ? "Create Site"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {children}
      </div>
    </section>
  );
}

type TextFieldProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: ReturnType<typeof useForm<any>>;
  name: keyof SiteFormValues;
  label: string;
  type?: string;
  step?: string;
  required?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rules?: any;
};

function TextField({
  form,
  name,
  label,
  type = "text",
  step,
  required,
  rules,
}: TextFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required ? <span className="text-destructive"> *</span> : null}
          </FormLabel>
          <FormControl>
            <Input type={type} step={step} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
