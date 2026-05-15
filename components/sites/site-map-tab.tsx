"use client";

import {useState, useTransition} from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Pencil, MapPin } from "lucide-react";

import { updateSiteLocation } from "@/lib/sites/actions";
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
  latitude: string;
  longitude: string;
};

type SiteMapTabProps = {
  siteId: string;
  latitude: number | null;
  longitude: number | null;
};

export function SiteMapTab({ siteId, latitude, longitude }: SiteMapTabProps) {
  const hasCoords = latitude !== null && longitude !== null;
  const [editing, setEditing] = useState(!hasCoords);

  if (editing) {
    return (
      <LocationForm
        siteId={siteId}
        defaultValues={{
          latitude: latitude !== null ? String(latitude) : "",
          longitude: longitude !== null ? String(longitude) : "",
        }}
        showCancel={hasCoords}
        onCancel={() => setEditing(false)}
        onSuccess={() => setEditing(false)}
      />
    );
  }

  const embedUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=11&output=embed`;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="size-4 text-muted-foreground" strokeWidth={2} />
          <span className="text-muted-foreground">
            {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="size-4" strokeWidth={2} />
          Edit
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <iframe
          src={embedUrl}
          width="100%"
          height="480"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Site location"
        />
      </div>
    </div>
  );
}

function LocationForm({
  siteId,
  defaultValues,
  showCancel,
  onCancel,
  onSuccess,
}: {
  siteId: string;
  defaultValues: FormValues;
  showCancel: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({ defaultValues });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateSiteLocation(siteId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Location saved.");
      onSuccess();
      router.refresh();
    });
  });

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium">Set site location</h2>
        <p className="text-sm text-muted-foreground">
          Enter latitude and longitude to drop a pin on the map.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="latitude"
              rules={{
                required: "Latitude is required.",
                validate: (v: string) => {
                  const n = Number(v);
                  return (
                    (Number.isFinite(n) && n >= -90 && n <= 90) ||
                    "Latitude must be between -90 and 90."
                  );
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Latitude <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 55.5"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="longitude"
              rules={{
                required: "Longitude is required.",
                validate: (v: string) => {
                  const n = Number(v);
                  return (
                    (Number.isFinite(n) && n >= -180 && n <= 180) ||
                    "Longitude must be between -180 and 180."
                  );
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Longitude <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. -4.2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center gap-3">
            {showCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Location"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
