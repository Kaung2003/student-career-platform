import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { slugify, uniqueSlugFrom } from "../lib/slugify.js";
import { HttpError, parse } from "../lib/http.js";
import { optionalText, optionalUrl, tagList } from "../lib/schemas.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/me", async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: req.auth!.userId },
    include: { projects: { orderBy: { createdAt: "desc" } } },
  });

  res.json({ profile });
});

const profileSchema = z.object({
  slug: z.string().trim().max(60).optional(),
  headline: optionalText(120).optional(),
  bio: optionalText(2000).optional(),
  school: optionalText(120).optional(),
  gradYear: z.number().int().min(1950).max(2100).nullable().optional(),
  skills: tagList.optional(),
  github: optionalUrl.optional(),
  linkedin: optionalUrl.optional(),
  website: optionalUrl.optional(),
  resumeUrl: optionalUrl.optional(),
  transcriptUrl: optionalUrl.optional(),
});

profileRouter.put("/me", async (req, res) => {
  const { slug, ...fields } = parse(profileSchema, req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });

  let desiredSlug = slug ? slugify(slug) : undefined;
  if (slug !== undefined && slug.trim() && !desiredSlug) {
    throw new HttpError(400, "slug: use letters or numbers");
  }

  const existing = await prisma.studentProfile.findUnique({ where: { userId: user.id } });

  if (!existing) {
    desiredSlug = await uniqueSlugFrom(desiredSlug ?? slugify(user.name));
  } else if (desiredSlug && desiredSlug !== existing.slug) {
    const clash = await prisma.studentProfile.findUnique({ where: { slug: desiredSlug } });
    if (clash) {
      throw new HttpError(409, "That portfolio URL is already taken");
    }
  }

  // Only fields the client actually sent are changed.
  const data = Object.fromEntries(
    Object.entries({ ...fields, ...(desiredSlug !== undefined ? { slug: desiredSlug } : {}) }).filter(([, v]) => v !== undefined),
  );

  const profile = existing
    ? await prisma.studentProfile.update({ where: { userId: user.id }, data })
    : await prisma.studentProfile.create({ data: { ...data, slug: desiredSlug!, userId: user.id } });

  res.json({ profile });
});

const DAY = 24 * 60 * 60 * 1000;

/** Portfolio views for the owner's dashboard: totals plus a 14-day series. */
profileRouter.get("/me/views", async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({ where: { userId: req.auth!.userId } });
  if (!profile) {
    res.json({ total: 0, last7: 0, daily: [] });
    return;
  }

  const start = new Date(Date.now() - 13 * DAY);
  start.setUTCHours(0, 0, 0, 0);

  const [total, last7, recent] = await Promise.all([
    prisma.profileView.count({ where: { profileId: profile.id } }),
    prisma.profileView.count({ where: { profileId: profile.id, createdAt: { gte: new Date(Date.now() - 7 * DAY) } } }),
    prisma.profileView.findMany({ where: { profileId: profile.id, createdAt: { gte: start } }, select: { createdAt: true } }),
  ]);

  const daily = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(start.getTime() + i * DAY).toISOString().slice(0, 10),
    count: 0,
  }));
  for (const view of recent) {
    const bucket = daily.find((d) => d.date === view.createdAt.toISOString().slice(0, 10));
    if (bucket) bucket.count += 1;
  }

  res.json({ total, last7, daily });
});
