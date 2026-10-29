import nodemailer, { type Transporter } from "nodemailer";

// Transactional email (verification links, password resets). Two providers are supported:
//   • SMTP — e.g. a Gmail account with an app password (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
//   • Resend — RESEND_API_KEY + EMAIL_FROM (needs a verified domain to email anyone but yourself)
// With neither configured, emails are written to the server log so local development still works.

function smtpConfigured() {
  return Boolean(process.env["SMTP_HOST"] && process.env["SMTP_USER"] && process.env["SMTP_PASS"]);
}

function resendConfigured() {
  return Boolean(process.env["RESEND_API_KEY"] && process.env["EMAIL_FROM"]);
}

export function isEmailConfigured(): boolean {
  return smtpConfigured() || resendConfigured();
}

let transporter: Transporter | null = null;

function smtp(): Transporter {
  if (!transporter) {
    const port = Number(process.env["SMTP_PORT"] ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env["SMTP_HOST"],
      port,
      secure: port === 465,
      auth: { user: process.env["SMTP_USER"], pass: process.env["SMTP_PASS"] },
    });
  }
  return transporter;
}

function fromAddress() {
  return process.env["EMAIL_FROM"] ?? `Student Career Platform <${process.env["SMTP_USER"]}>`;
}

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (smtpConfigured()) {
    await smtp().sendMail({ from: fromAddress(), to, subject, text });
    return;
  }

  if (resendConfigured()) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env["RESEND_API_KEY"]}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromAddress(), to, subject, text }),
    });
    if (!res.ok) {
      throw new Error(`Email provider responded ${res.status}: ${await res.text()}`);
    }
    return;
  }

  console.info(`[email:not-configured] to=${to} subject="${subject}"\n${text}`);
}

/** Public URL of the frontend, used in links inside emails. */
export function appUrl(): string {
  // Never derived from request headers: a forged Origin could point links at another site.
  const fallback = process.env["RENDER"] ? "https://student-career-platform.netlify.app" : "http://localhost:5173";
  return (process.env["APP_URL"] ?? fallback).replace(/\/+$/, "");
}
