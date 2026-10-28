// Puts each student's name and headline into /p/:slug's <head>, so search engines and
// link previews (LinkedIn, Slack, WhatsApp...) show real content instead of the generic app title.
import type { Config, Context } from "https://edge.netlify.com";

const API = Netlify.env.get("API_ORIGIN") ?? "https://student-career-platform-backend.onrender.com";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export default async function handler(request: Request, context: Context) {
  const response = await context.next();
  const slug = new URL(request.url).pathname.split("/")[2];
  if (!slug || !response.headers.get("content-type")?.includes("text/html")) return response;

  let profile: { name: string; headline: string | null; bio: string | null; school: string | null } | null = null;
  try {
    // Never hold the page hostage to a slow API: fall back to the normal page after 2.5s.
    const res = await fetch(`${API}/api/public/${encodeURIComponent(slug)}?track=0`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) profile = await res.json();
  } catch {
    return response;
  }
  if (!profile) return response;

  const title = `${profile.name}${profile.headline ? ` — ${profile.headline}` : ""} | Student Career Platform`;
  const description = (profile.bio ?? profile.headline ?? `${profile.name}'s portfolio${profile.school ? ` · ${profile.school}` : ""}`)
    .replace(/\s+/g, " ")
    .slice(0, 200);
  const url = new URL(request.url);
  url.search = "";

  const tags = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}" />`,
    `<link rel="canonical" href="${escape(url.toString())}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${escape(url.toString())}" />`,
    `<meta name="twitter:title" content="${escape(title)}" />`,
    `<meta name="twitter:description" content="${escape(description)}" />`,
  ].join("\n    ");

  const html = (await response.text())
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, "")
    .replace(/<meta\s+property="og:(title|description|type)"[\s\S]*?\/>/g, "")
    .replace("</head>", `    ${tags}\n  </head>`);

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(html, { status: response.status, headers });
}

export const config: Config = { path: "/p/*" };
