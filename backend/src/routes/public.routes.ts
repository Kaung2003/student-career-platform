import { createHash } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { optionalAuth, requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { HttpError, parse } from "../lib/http.js";
import { clientIp } from "../lib/client-ip.js";
import { notify } from "../lib/notify.js";

export const publicRouter = Router();

publicRouter.get("/", async (req, res) => {
  const { q } = parse(z.object({ q: z.string().trim().max(100).optional() }), req.query);

  const profiles = await prisma.studentProfile.findMany({
    where: q
      ? {
          OR: [
            { user: { name: { contains: q, mode: "insensitive" } } },
            { school: { contains: q, mode: "insensitive" } },
            { headline: { contains: q, mode: "insensitive" } },
            { skills: { has: q } },
          ],
          user: { suspended: false },
        }
      : { user: { suspended: false } },
    include: { user: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
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

/** Slugs for the sitemap. */
publicRouter.get("/sitemap", async (_req, res) => {
  const profiles = await prisma.studentProfile.findMany({
    where: { user: { suspended: false } },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });
  res.json({ profiles });
});

function visitorHash(ip: string, profileId: string) {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env["JWT_SECRET"] ?? "";
  return createHash("sha256").update(`${salt}:${profileId}:${day}:${ip}`).digest("hex");
}

async function recordView(profileId: string, ip: string) {
  try {
    await prisma.profileView.create({ data: { profileId, visitorHash: visitorHash(ip, profileId) } });
  } catch {
    // Unique constraint: this visitor was already counted today.
  }
}

publicRouter.get("/:slug", optionalAuth, async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({
    where: { slug: req.params["slug"] as string },
    include: {
      user: {
        select: {
          name: true,
          suspended: true,
          certifications: {
            where: { status: "COMPLETED" },
            select: { id: true, name: true, provider: true, examDate: true },
            orderBy: { examDate: "desc" },
          },
        },
      },
      projects: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile || profile.user.suspended) {
    throw new HttpError(404, "Portfolio not found");
  }

  // Count visits from everyone except the owner; crawlers asking only for share-preview data opt out.
  if (req.auth?.userId !== profile.userId && req.query["track"] !== "0") {
    void recordView(profile.id, clientIp(req));
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
    resumeUrl: profile.resumeUrl,
    certifications: profile.user.certifications,
    projects: profile.projects,
  });
});

async function profileBySlugOr404(slug: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { slug } });
  if (!profile) {
    throw new HttpError(404, "Portfolio not found");
  }
  return profile;
}

publicRouter.get("/:slug/comments", async (req, res) => {
  const profile = await profileBySlugOr404(req.params["slug"] as string);

  const comments = await prisma.comment.findMany({
    where: { profileId: profile.id },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
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

const commentSchema = z.object({
  body: z.string().trim().min(1, "is required").max(1000, "must be at most 1000 characters"),
});

publicRouter.post("/:slug/comments", requireAuth, async (req, res) => {
  const { body } = parse(commentSchema, req.body);
  const profile = await profileBySlugOr404(req.params["slug"] as string);

  const comment = await prisma.comment.create({
    data: { body, profileId: profile.id, authorId: req.auth!.userId },
    include: { author: { select: { name: true } } },
  });

  if (profile.userId !== req.auth!.userId) {
    await notify(profile.userId, "COMMENT", { name: comment.author.name, slug: profile.slug });
  }

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
  const profile = await profileBySlugOr404(req.params["slug"] as string);
  const comment = await prisma.comment.findUnique({ where: { id: req.params["commentId"] as string } });

  if (!comment || comment.profileId !== profile.id) {
    throw new HttpError(404, "Comment not found");
  }

  const isAuthor = comment.authorId === req.auth!.userId;
  const isOwner = profile.userId === req.auth!.userId;

  if (!isAuthor && !isOwner) {
    throw new HttpError(403, "You can't delete this comment");
  }

  await prisma.comment.delete({ where: { id: comment.id } });
  res.status(204).send();
});
