"use client";

import { useState , useEffect} from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const RESEND_COOLDOWN_S = 30;

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async ({ otp, password }) => {
    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password,
    });

    if (error) {
      toast.error(error.message ?? "Could not reset password.");
      form.setValue("otp", "");
      return;
    }

    toast.success("Password reset. Sign in with your new password.");
    router.push("/auth");
  });

  const onResend = async () => {
    setIsResending(true);
    const { error } = await authClient.forgetPassword.emailOtp({ email });
    setIsResending(false);

    if (error) {
      toast.error(error.message ?? "Could not resend code.");
      return;
    }

    toast.success("Code sent.");
    setCooldown(RESEND_COOLDOWN_S);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>
          Enter the code we sent to{" "}
          <span className="text-foreground">{email}</span> and a new password.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="items-center">
                  <FormLabel className="self-start">Code</FormLabel>
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                      containerClassName="gap-2"
                    >
                      <InputOTPGroup><InputOTPSlot index={0} className="size-12 text-base" /></InputOTPGroup>
                      <InputOTPGroup><InputOTPSlot index={1} className="size-12 text-base" /></InputOTPGroup>
                      <InputOTPGroup><InputOTPSlot index={2} className="size-12 text-base" /></InputOTPGroup>
                      <InputOTPGroup><InputOTPSlot index={3} className="size-12 text-base" /></InputOTPGroup>
                      <InputOTPGroup><InputOTPSlot index={4} className="size-12 text-base" /></InputOTPGroup>
                      <InputOTPGroup><InputOTPSlot index={5} className="size-12 text-base" /></InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-muted-foreground">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || isResending}
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 disabled:no-underline disabled:opacity-60"
          >
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : isResending
                ? "Sending…"
                : "Resend"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
