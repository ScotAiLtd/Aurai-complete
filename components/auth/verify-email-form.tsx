"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { verifyOtpSchema, type VerifyOtpValues } from "@/lib/schemas/auth";
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
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const RESEND_COOLDOWN_S = 30;

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [cooldown, setCooldown] = React.useState(0);
  const [isResending, setIsResending] = React.useState(false);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const form = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { otp: "" },
  });

  const onSubmit = form.handleSubmit(async ({ otp }) => {
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp });

    if (error) {
      toast.error(error.message ?? "Could not verify code.");
      form.setValue("otp", "");
      return;
    }

    toast.success("Email verified.");
    router.push("/dashboard");
    router.refresh();
  });

  const onResend = async () => {
    setIsResending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
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
        <CardTitle className="text-xl">Verify your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to{" "}
          <span className="text-foreground">{email}</span>. Enter it below to
          finish signing up.
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
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                      onComplete={() => onSubmit()}
                      containerClassName="gap-2"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="size-12 text-base" />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={1} className="size-12 text-base" />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={2} className="size-12 text-base" />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="size-12 text-base" />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={4} className="size-12 text-base" />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={5} className="size-12 text-base" />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Verifying…" : "Verify email"}
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
