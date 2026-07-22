import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/require-auth.js";

export const publicRouter = Router();

publicRouter.get("/", async (req, res) => {
  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";

  const profiles = await prisma.studentProfile.findMany({
    where: q
      ? {
          OR: [
            { user: { name: { contains: q, mode: "insensitive" } } },
            { school: { contains: q, mode: "insensitive" } },
            { headline: { contains: q, mode: "insensitive" } },
            { skills: { has: q } },
          ],
        }
      : {},
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json({
    profiles: profiles.map((profile) => ({
      name: profile.user.name,
      slug: profile.slug,
      headline: profile.headline,
      school: profile.school,
      gradYear: profile.gradYear,
      skills: profile.skills,
    })),
  });
});

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
    userId: profile.userId,
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

publicRouter.get("/:slug/comments", async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({ where: { slug: req.params["slug"] } });

  if (!profile) {
    res.status(404).json({ error: "Portfolio not found" });
    return;
  }

  const comments = await prisma.comment.findMany({
    where: { profileId: profile.id },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    comments: comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      authorId: comment.authorId,
      authorName: comment.author.name,
      createdAt: comment.createdAt,
    })),
  });
});

publicRouter.post("/:slug/comments", requireAuth, async (req, res) => {
  const { body } = req.body ?? {};

  if (typeof body !== "string" || body.trim().length === 0) {
    res.status(400).json({ error: "body is required" });
    return;
  }

  if (body.trim().length > 1000) {
    res.status(400).json({ error: "Comment must be 1000 characters or fewer" });
    return;
  }

  const profile = await prisma.studentProfile.findUnique({ where: { slug: req.params["slug"] as string } });

  if (!profile) {
    res.status(404).json({ error: "Portfolio not found" });
    return;
  }

  const comment = await prisma.comment.create({
    data: { body: body.trim(), profileId: profile.id, authorId: req.auth!.userId },
    include: { author: { select: { name: true } } },
  });

  res.status(201).json({
    comment: {
      id: comment.id,
      body: comment.body,
      authorId: comment.authorId,
      authorName: comment.author.name,
      createdAt: comment.createdAt,
    },
  });
});

publicRouter.delete("/:slug/comments/:commentId", requireAuth, async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({ where: { slug: req.params["slug"] as string } });

  if (!profile) {
    res.status(404).json({ error: "Portfolio not found" });
    return;
  }

  const comment = await prisma.comment.findUnique({ where: { id: req.params["commentId"] as string } });

  if (!comment || comment.profileId !== profile.id) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  const isAuthor = comment.authorId === req.auth!.userId;
  const isOwner = profile.userId === req.auth!.userId;

  if (!isAuthor && !isOwner) {
    res.status(403).json({ error: "You can't delete this comment" });
    return;
  }

  await prisma.comment.delete({ where: { id: comment.id } });
  res.status(204).send();
});
