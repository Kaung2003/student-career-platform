// Sends transactional email through Resend (https://resend.com) when RESEND_API_KEY is set.
// Without it, emails are written to the server log so local development still works.

export function isEmailConfigured(): boolean {
  return Boolean(process.env["RESEND_API_KEY"] && process.env["EMAIL_FROM"]);
}

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!isEmailConfigured()) {
    console.info(`[email:not-configured] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env["RESEND_API_KEY"]}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env["EMAIL_FROM"], to, subject, text }),
  });

  if (!res.ok) {
    throw new Error(`Email provider responded ${res.status}: ${await res.text()}`);
  }
}

/** Public URL of the frontend, used in links inside emails. */
export function appUrl(): string {
  // Never derived from request headers: a forged Origin could point reset links at another site.
  const fallback = process.env["RENDER"] ? "https://student-career-platform.netlify.app" : "http://localhost:5173";
  return (process.env["APP_URL"] ?? fallback).replace(/\/+$/, "");
}
