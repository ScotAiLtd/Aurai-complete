"use client";

import {useTransition} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
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
    <Button variant="outline" onClick={onClick} disabled={isPending}>
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
