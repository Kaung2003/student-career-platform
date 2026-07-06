import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";

export const projectRouter = Router();

projectRouter.use(requireAuth);

async function getOwnProfileOr404(userId: string) {
  return prisma.studentProfile.findUnique({ where: { userId } });
}

projectRouter.get("/", async (req, res) => {
  const profile = await getOwnProfileOr404(req.auth!.userId);

  if (!profile) {
    res.json({ projects: [] });
    return;
  }

  const projects = await prisma.project.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  res.json({ projects });
});

projectRouter.post("/", async (req, res) => {
  const profile = await getOwnProfileOr404(req.auth!.userId);

  if (!profile) {
    res.status(400).json({ error: "Create your profile before adding projects" });
    return;
  }

  const { title, description, techStack, projectUrl, githubUrl, imageUrl } = req.body ?? {};

  if (typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  if (techStack !== undefined && (!Array.isArray(techStack) || !techStack.every((t: unknown) => typeof t === "string"))) {
    res.status(400).json({ error: "techStack must be an array of strings" });
    return;
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      techStack: techStack ?? [],
      projectUrl,
      githubUrl,
      imageUrl,
      profileId: profile.id,
    },
  });

  res.status(201).json({ project });
});

projectRouter.put("/:id", async (req, res) => {
  const profile = await getOwnProfileOr404(req.auth!.userId);
  const existing = profile ? await prisma.project.findUnique({ where: { id: req.params["id"] } }) : null;

  if (!profile || !existing || existing.profileId !== profile.id) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const { title, description, techStack, projectUrl, githubUrl, imageUrl } = req.body ?? {};

  if (techStack !== undefined && (!Array.isArray(techStack) || !techStack.every((t: unknown) => typeof t === "string"))) {
    res.status(400).json({ error: "techStack must be an array of strings" });
    return;
  }

  const project = await prisma.project.update({
    where: { id: existing.id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(techStack !== undefined ? { techStack } : {}),
      ...(projectUrl !== undefined ? { projectUrl } : {}),
      ...(githubUrl !== undefined ? { githubUrl } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  });

  res.json({ project });
});

projectRouter.delete("/:id", async (req, res) => {
  const profile = await getOwnProfileOr404(req.auth!.userId);
  const existing = profile ? await prisma.project.findUnique({ where: { id: req.params["id"] } }) : null;

  if (!profile || !existing || existing.profileId !== profile.id) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  await prisma.project.delete({ where: { id: existing.id } });

  res.status(204).send();
});
