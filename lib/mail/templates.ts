type OtpType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

type Template = {
  subject: string;
  html: string;
  text: string;
};

const APP_NAME = "Aurai";

function wrap(title: string, body: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0a0a0a;color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#171717;border-radius:12px;padding:32px;">
      <tr><td>
        <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;">${title}</h1>
        ${body}
        <p style="margin:32px 0 0;font-size:12px;color:#a3a3a3;">${APP_NAME}</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

function otpBlock(otp: string) {
  return `<div style="margin:24px 0;padding:16px;background:#262626;border-radius:8px;text-align:center;font-family:ui-monospace,SFMono-Regular,monospace;font-size:28px;letter-spacing:8px;font-weight:600;">${otp}</div>`;
}

export function buildOtpEmail(type: OtpType, otp: string): Template {
  switch (type) {
    case "email-verification":
      return {
        subject: `Verify your ${APP_NAME} email`,
        html: wrap(
          "Verify your email",
          `<p style="margin:0 0 8px;font-size:14px;color:#d4d4d4;">Use this code to finish setting up your account. It expires in 5 minutes.</p>
           ${otpBlock(otp)}
           <p style="margin:0;font-size:13px;color:#a3a3a3;">If you didn't sign up, ignore this email.</p>`
        ),
        text: `Verify your email\n\nYour code: ${otp}\n\nThis code expires in 5 minutes. If you didn't sign up, ignore this email.`,
      };

    case "forget-password":
      return {
        subject: `Reset your ${APP_NAME} password`,
        html: wrap(
          "Reset your password",
          `<p style="margin:0 0 8px;font-size:14px;color:#d4d4d4;">Use this code to reset your password. It expires in 5 minutes.</p>
           ${otpBlock(otp)}
           <p style="margin:0;font-size:13px;color:#a3a3a3;">If you didn't request a reset, you can safely ignore this email.</p>`
        ),
        text: `Reset your password\n\nYour code: ${otp}\n\nThis code expires in 5 minutes. If you didn't request a reset, you can ignore this email.`,
      };

    case "sign-in":
      return {
        subject: `Your ${APP_NAME} sign-in code`,
        html: wrap(
          "Sign in",
          `<p style="margin:0 0 8px;font-size:14px;color:#d4d4d4;">Use this code to sign in. It expires in 5 minutes.</p>
           ${otpBlock(otp)}`
        ),
        text: `Sign in\n\nYour code: ${otp}\n\nThis code expires in 5 minutes.`,
      };

    case "change-email":
      return {
        subject: `Confirm your new ${APP_NAME} email`,
        html: wrap(
          "Confirm your email change",
          `<p style="margin:0 0 8px;font-size:14px;color:#d4d4d4;">Use this code to confirm your new email address. It expires in 5 minutes.</p>
           ${otpBlock(otp)}`
        ),
        text: `Confirm your email change\n\nYour code: ${otp}\n\nThis code expires in 5 minutes.`,
      };
  }
}
