"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type SidebarUserProps = {
  name: string | null | undefined;
  email: string;
};

export function SidebarUser({ name, email }: SidebarUserProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initials =
    (name ?? email)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || email[0]?.toUpperCase();

  const onSignOut = () => {
    startTransition(async () => {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error(error.message ?? "Could not sign out.");
        return;
      }
      router.push("/auth");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-sidebar-foreground">
          {name ?? "—"}
        </div>
        <div className="truncate text-xs text-sidebar-foreground/60">
          {email}
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        disabled={isPending}
        aria-label="Sign out"
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-foreground",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        <LogOut className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
