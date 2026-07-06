import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const publicRouter = Router();

publicRouter.get("/:slug", async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({
    where: { slug: req.params["slug"] },
    include: {
      user: { select: { name: true } },
      projects: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) {
    res.status(404).json({ error: "Portfolio not found" });
    return;
  }

  res.json({
    name: profile.user.name,
    slug: profile.slug,
    headline: profile.headline,
    bio: profile.bio,
    school: profile.school,
    gradYear: profile.gradYear,
    skills: profile.skills,
    github: profile.github,
    linkedin: profile.linkedin,
    website: profile.website,
    projects: profile.projects,
  });
});
