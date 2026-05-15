import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session!.user;

  return (
    <div className="flex flex-col gap-2 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Welcome back, {user.name ?? user.email}.
      </p>
    </div>
  );
}
