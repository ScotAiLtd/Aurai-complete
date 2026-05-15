import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins/email-otp";

import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail/mailgun";
import { buildOtpEmail } from "@/lib/mail/templates";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: ["http://localhost:3000", "http://149.36.1.94:3000"],
  plugins: [
    emailOTP({
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      storeOTP: "hashed",
      sendVerificationOTP: async ({ email, otp, type }) => {
        const { subject, html, text } = buildOtpEmail(type, otp);
        try {
          await sendMail({ to: email, subject, html, text });
        } catch (err) {
          console.error("[auth] sendVerificationOTP failed:", err);
        }
      },
    }),
  ],
});
