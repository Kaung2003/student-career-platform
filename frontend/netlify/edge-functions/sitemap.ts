// /sitemap.xml: the public pages plus every student portfolio, so search engines can find them.
import type { Config } from "https://edge.netlify.com";

const API = Netlify.env.get("API_ORIGIN") ?? "https://student-career-platform-backend.onrender.com";

export default async function handler(request: Request) {
  const origin = new URL(request.url).origin;
  const entries: { loc: string; lastmod?: string }[] = ["/", "/directory", "/privacy", "/terms"].map((p) => ({ loc: `${origin}${p}` }));

  try {
    const res = await fetch(`${API}/api/public/sitemap`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const { profiles } = (await res.json()) as { profiles: { slug: string; updatedAt: string }[] };
      for (const p of profiles) {
        entries.push({ loc: `${origin}/p/${encodeURIComponent(p.slug)}`, lastmod: p.updatedAt.slice(0, 10) });
      }
    }
  } catch {
    // Serve the static pages even if the API is asleep.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}

export const config: Config = { path: "/sitemap.xml" };
