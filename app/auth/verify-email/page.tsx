import { redirect } from "next/navigation";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  if (!email) {
    redirect("/auth");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <VerifyEmailForm email={email} />
    </div>
  );
}
