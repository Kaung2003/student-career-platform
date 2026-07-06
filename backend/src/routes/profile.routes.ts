import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { slugify } from "../lib/slugify.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/me", async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: req.auth!.userId },
    include: { projects: { orderBy: { createdAt: "desc" } } },
  });

  res.json({ profile });
});

profileRouter.put("/me", async (req, res) => {
  const { headline, bio, school, gradYear, skills, github, linkedin, website, slug, resumeUrl, transcriptUrl } =
    req.body ?? {};

  if (skills !== undefined && (!Array.isArray(skills) || !skills.every((s: unknown) => typeof s === "string"))) {
    res.status(400).json({ error: "skills must be an array of strings" });
    return;
  }

  if (gradYear !== undefined && gradYear !== null && typeof gradYear !== "number") {
    res.status(400).json({ error: "gradYear must be a number" });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });

  let desiredSlug: string | undefined;
  if (typeof slug === "string" && slug.trim().length > 0) {
    desiredSlug = slugify(slug);
  }

  const existing = await prisma.studentProfile.findUnique({ where: { userId: user.id } });

  if (!existing) {
    const baseSlug = desiredSlug ?? slugify(user.name) ?? "student";
    let candidate = baseSlug;
    let attempt = 0;
    while (await prisma.studentProfile.findUnique({ where: { slug: candidate } })) {
      attempt += 1;
      candidate = `${baseSlug}-${attempt}`;
    }
    desiredSlug = candidate;
  } else if (desiredSlug && desiredSlug !== existing.slug) {
    const clash = await prisma.studentProfile.findUnique({ where: { slug: desiredSlug } });
    if (clash) {
      res.status(409).json({ error: "That portfolio URL is already taken" });
      return;
    }
  }

  const data = {
    ...(desiredSlug !== undefined ? { slug: desiredSlug } : {}),
    ...(headline !== undefined ? { headline } : {}),
    ...(bio !== undefined ? { bio } : {}),
    ...(school !== undefined ? { school } : {}),
    ...(gradYear !== undefined ? { gradYear } : {}),
    ...(skills !== undefined ? { skills } : {}),
    ...(github !== undefined ? { github } : {}),
    ...(linkedin !== undefined ? { linkedin } : {}),
    ...(website !== undefined ? { website } : {}),
    ...(resumeUrl !== undefined ? { resumeUrl } : {}),
    ...(transcriptUrl !== undefined ? { transcriptUrl } : {}),
  };

  const profile = existing
    ? await prisma.studentProfile.update({ where: { userId: user.id }, data })
    : await prisma.studentProfile.create({ data: { ...data, slug: desiredSlug!, userId: user.id } });

  res.json({ profile });
});
