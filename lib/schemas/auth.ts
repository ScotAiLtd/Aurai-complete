import { z } from "zod";

export const signInSchema = z.object({
  email: z.email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(60, { message: "Name must be at most 60 characters." }),
  email: z.email({ message: "Enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .max(128, { message: "Password must be at most 128 characters." }),
});

export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .length(6, { message: "Enter the 6-digit code." })
    .regex(/^\d{6}$/, { message: "Code must be 6 digits." }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Enter a valid email address." }),
});

export const resetPasswordSchema = z.object({
  otp: z
    .string()
    .length(6, { message: "Enter the 6-digit code." })
    .regex(/^\d{6}$/, { message: "Code must be 6 digits." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .max(128, { message: "Password must be at most 128 characters." }),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
