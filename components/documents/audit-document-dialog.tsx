"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { startAudit } from "@/lib/audits/actions";
import {
  AUDIT_AGENTS,
  AUDIT_AGENT_LABELS,
  AUDIT_AGENT_DESCRIPTIONS,
} from "@/lib/schemas/audit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Agent = (typeof AUDIT_AGENTS)[number];
type Mode = "SUPER" | "STANDARD";

export function AuditDocumentDialog({
  documentId,
  fileName,
  trigger,
}: {
  documentId: string;
  fileName: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<Mode>("STANDARD");
  const [agents, setAgents] = useState<Agent[]>([...AUDIT_AGENTS]);
  const [customName, setCustomName] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  const toggleAgent = (a: Agent) =>
    setAgents((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );

  const onSubmit = () => {
    if (agents.length === 0) {
      toast.error("Select at least one agent.");
      return;
    }
    startTransition(async () => {
      const result = await startAudit(documentId, {
        mode,
        enabledAgents: agents,
        customAgentName: customName.trim() || undefined,
        customAgentPrompt: customPrompt.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Audit started results arrive when it finishes.");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Audit document</DialogTitle>
          <DialogDescription className="truncate">{fileName}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1">
          {/* Depth */}
          <div className="flex flex-col gap-2.5">
            <Label>Depth</Label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["STANDARD", "Standard", "Faster single pass"],
                  ["SUPER", "Super audit", "Every page, triple pass"],
                ] as const
              ).map(([value, title, sub]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left ring-1 transition-colors",
                    mode === value
                      ? "bg-primary/10 ring-primary"
                      : "ring-foreground/10 hover:bg-muted/50",
                  )}
                >
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-xs text-muted-foreground">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Agents */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <Label>Agents</Label>
              <span className="text-xs text-muted-foreground">
                {agents.length} of {AUDIT_AGENTS.length} selected
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl p-1 ring-1 ring-foreground/10">
              {AUDIT_AGENTS.map((a) => (
                <label
                  key={a}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={agents.includes(a)}
                    onCheckedChange={() => toggleAgent(a)}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {AUDIT_AGENT_LABELS[a]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {AUDIT_AGENT_DESCRIPTIONS[a]}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom check */}
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="custom-agent-name">Custom check (optional)</Label>
            <Input
              id="custom-agent-name"
              placeholder="Name, e.g. Bolt torque check"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <textarea
              placeholder="Instructions for a custom analysis agent…"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              className="rounded-xl bg-input/30 px-3 py-2 text-sm ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? "Starting…" : "Start Audit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
