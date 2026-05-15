import "server-only";

import Mailgun from "mailgun.js";
import formData from "form-data";

type SendMailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const from = process.env.MAILGUN_FROM ?? "Aurai <noreply@example.com>";
const region = (process.env.MAILGUN_REGION ?? "us").toLowerCase();

const mailgunUrl =
  region === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";

let client: ReturnType<InstanceType<typeof Mailgun>["client"]> | null = null;

function getClient() {
  if (!apiKey) return null;
  if (!client) {
    client = new Mailgun(formData).client({
      username: "api",
      key: apiKey,
      url: mailgunUrl,
    });
  }
  return client;
}

export async function sendMail({ to, subject, html, text }: SendMailArgs) {
  const mg = getClient();

  if (!mg || !domain) {
    console.log(text);
    return;
  }

  try {
    // await mg.messages.create(domain, { from, to, subject, html, text });
    const response = await mg.messages.create(domain, {
      from,
      to,
      subject,
      html,
      text,
    });
    // console.log("[mail] Mailgun Response:", response);
  } catch (error) {
    console.error("[mail] Mailgun send failed:", error);
    throw error;
  }
}
