import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  if (!email) {
    redirect("/auth/forgot-password");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <ResetPasswordForm email={email} />
    </div>
  );
}
