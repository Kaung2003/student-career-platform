import nodemailer, { type Transporter } from "nodemailer";

// Transactional email (verification links, password resets). Providers, in order of preference:
//   • Brevo — BREVO_API_KEY + EMAIL_FROM. HTTPS API, works on hosts that block SMTP (e.g. Render's free plan);
//     the sender only needs to be a verified single address such as your Gmail.
//   • Resend — RESEND_API_KEY + EMAIL_FROM (needs a verified domain to email anyone but yourself)
//   • SMTP — e.g. Gmail with an app password (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS); needs outbound SMTP.
// With none configured, emails are written to the server log so local development still works.

function smtpConfigured() {
  return Boolean(process.env["SMTP_HOST"] && process.env["SMTP_USER"] && process.env["SMTP_PASS"]);
}

function resendConfigured() {
  return Boolean(process.env["RESEND_API_KEY"] && process.env["EMAIL_FROM"]);
}

function brevoConfigured() {
  return Boolean(process.env["BREVO_API_KEY"] && process.env["EMAIL_FROM"]);
}

export function isEmailConfigured(): boolean {
  return brevoConfigured() || resendConfigured() || smtpConfigured();
}

/** Parses `Name <address>` (or a bare address) for providers that want them separately. */
function parseFrom(from: string) {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from);
  return match ? { name: match[1] || undefined, email: match[2]! } : { email: from.trim() };
}

const EMAIL_TIMEOUT_MS = 15_000;

let transporter: Transporter | null = null;

function smtp(): Transporter {
  if (!transporter) {
    const port = Number(process.env["SMTP_PORT"] ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env["SMTP_HOST"],
      port,
      secure: port === 465,
      auth: { user: process.env["SMTP_USER"], pass: process.env["SMTP_PASS"] },
      // Fail fast when the host blocks SMTP instead of hanging for minutes.
      connectionTimeout: EMAIL_TIMEOUT_MS,
      greetingTimeout: EMAIL_TIMEOUT_MS,
      socketTimeout: EMAIL_TIMEOUT_MS,
    });
  }
  return transporter;
}

function fromAddress() {
  return process.env["EMAIL_FROM"] ?? `Student Career Platform <${process.env["SMTP_USER"]}>`;
}

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (brevoConfigured()) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": process.env["BREVO_API_KEY"]!, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender: parseFrom(fromAddress()), to: [{ email: to }], subject, textContent: text }),
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`Brevo responded ${res.status}: ${await res.text()}`);
    }
    return;
  }

  if (resendConfigured()) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env["RESEND_API_KEY"]}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromAddress(), to, subject, text }),
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`Email provider responded ${res.status}: ${await res.text()}`);
    }
    return;
  }

  if (smtpConfigured()) {
    await smtp().sendMail({ from: fromAddress(), to, subject, text });
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
