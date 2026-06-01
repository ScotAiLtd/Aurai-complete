"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTurbineModel } from "@/lib/turbine-models/actions";

export type TurbineModelOption = {
  id: string;
  name: string;
};

type Props = {
  value: string;
  onChange: (id: string) => void;
  models: TurbineModelOption[];
  onModelCreated?: (model: TurbineModelOption) => void;
};

export function TurbineModelPicker({
  value,
  onChange,
  models,
  onModelCreated,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const saveNew = () => {
    const name = draft.trim();
    if (!name) {
      toast.error("Enter a model name.");
      return;
    }
    startTransition(async () => {
      const result = await createTurbineModel({ name });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onModelCreated?.({ id: result.id, name: result.name });
      onChange(result.id);
      setDraft("");
      setAdding(false);
      toast.success(`Added ${result.name}.`);
    });
  };

  if (adding) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          placeholder="e.g. Vestas V52 850KW"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              saveNew();
            }
            if (e.key === "Escape") {
              setAdding(false);
              setDraft("");
            }
          }}
          disabled={isPending}
        />
        <Button
          type="button"
          size="sm"
          onClick={saveNew}
          disabled={isPending}
        >
          {isPending ? "Adding…" : "Add"}
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={() => {
            setAdding(false);
            setDraft("");
          }}
          disabled={isPending}
          aria-label="Cancel"
        >
          <X className="size-4" strokeWidth={2} />
        </Button>
      </div>
    );
  }

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a turbine model" />
      </SelectTrigger>
      <SelectContent>
        {models.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            No models yet — add one below.
          </div>
        ) : (
          models.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))
        )}
        <div className="border-t border-border p-1">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            onMouseDown={(e) => {
              e.preventDefault();
              setAdding(true);
            }}
          >
            <Plus className="size-4" strokeWidth={2} />
            Add new model…
          </button>
        </div>
      </SelectContent>
    </Select>
  );
}
