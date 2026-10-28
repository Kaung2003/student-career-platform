import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { HttpError, parse } from "../lib/http.js";
import { optionalText, optionalUrl, tagList } from "../lib/schemas.js";

export const projectRouter = Router();

projectRouter.use(requireAuth);

const projectSchema = z.object({
  title: z.string().trim().min(1, "is required").max(120, "must be at most 120 characters"),
  description: optionalText(2000).optional(),
  techStack: tagList.optional(),
  projectUrl: optionalUrl.optional(),
  githubUrl: optionalUrl.optional(),
  imageUrl: optionalUrl.optional(),
});

const MAX_PROJECTS = 50;

function ownProfile(userId: string) {
  return prisma.studentProfile.findUnique({ where: { userId } });
}

async function ownProjectOr404(userId: string, id: string) {
  const profile = await ownProfile(userId);
  const project = profile ? await prisma.project.findUnique({ where: { id } }) : null;
  if (!profile || !project || project.profileId !== profile.id) {
    throw new HttpError(404, "Project not found");
  }
  return project;
}

projectRouter.get("/", async (req, res) => {
  const profile = await ownProfile(req.auth!.userId);
  const projects = profile
    ? await prisma.project.findMany({ where: { profileId: profile.id }, orderBy: { createdAt: "desc" } })
    : [];
  res.json({ projects });
});

projectRouter.post("/", async (req, res) => {
  const profile = await ownProfile(req.auth!.userId);
  if (!profile) {
    throw new HttpError(400, "Create your profile before adding projects");
  }

  const body = parse(projectSchema, req.body);

  if ((await prisma.project.count({ where: { profileId: profile.id } })) >= MAX_PROJECTS) {
    throw new HttpError(400, `You can have at most ${MAX_PROJECTS} projects`);
  }

  const project = await prisma.project.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      techStack: body.techStack ?? [],
      projectUrl: body.projectUrl ?? null,
      githubUrl: body.githubUrl ?? null,
      imageUrl: body.imageUrl ?? null,
      profileId: profile.id,
    },
  });

  res.status(201).json({ project });
});

projectRouter.put("/:id", async (req, res) => {
  const existing = await ownProjectOr404(req.auth!.userId, req.params["id"] as string);
  const body = parse(projectSchema.partial(), req.body);

  const project = await prisma.project.update({
    where: { id: existing.id },
    data: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)),
  });

  res.json({ project });
});

projectRouter.delete("/:id", async (req, res) => {
  const existing = await ownProjectOr404(req.auth!.userId, req.params["id"] as string);
  await prisma.project.delete({ where: { id: existing.id } });
  res.status(204).send();
});
