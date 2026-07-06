import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";

export const certificationRouter = Router();

certificationRouter.use(requireAuth);

const STATUSES = ["PLANNING", "IN_PROGRESS", "COMPLETED"] as const;
type CertStatus = (typeof STATUSES)[number];

function isCertStatus(value: unknown): value is CertStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

certificationRouter.get("/", async (req, res) => {
  const certifications = await prisma.certification.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: "desc" },
  });

  res.json({ certifications });
});

certificationRouter.post("/", async (req, res) => {
  const { name, provider, examDate, status, notes, resourceUrl } = req.body ?? {};

  if (typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  if (status !== undefined && !isCertStatus(status)) {
    res.status(400).json({ error: `status must be one of: ${STATUSES.join(", ")}` });
    return;
  }

  const certification = await prisma.certification.create({
    data: {
      name,
      provider: provider || null,
      examDate: examDate ? new Date(examDate) : null,
      status: status ?? "PLANNING",
      notes: notes || null,
      resourceUrl: resourceUrl || null,
      userId: req.auth!.userId,
    },
  });

  res.status(201).json({ certification });
});

certificationRouter.put("/:id", async (req, res) => {
  const existing = await prisma.certification.findUnique({ where: { id: req.params["id"] } });

  if (!existing || existing.userId !== req.auth!.userId) {
    res.status(404).json({ error: "Certification not found" });
    return;
  }

  const { name, provider, examDate, status, notes, resourceUrl } = req.body ?? {};

  if (status !== undefined && !isCertStatus(status)) {
    res.status(400).json({ error: `status must be one of: ${STATUSES.join(", ")}` });
    return;
  }

  const certification = await prisma.certification.update({
    where: { id: existing.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(provider !== undefined ? { provider: provider || null } : {}),
      ...(examDate !== undefined ? { examDate: examDate ? new Date(examDate) : null } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      ...(resourceUrl !== undefined ? { resourceUrl: resourceUrl || null } : {}),
    },
  });

  res.json({ certification });
});

certificationRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.certification.findUnique({ where: { id: req.params["id"] } });

  if (!existing || existing.userId !== req.auth!.userId) {
    res.status(404).json({ error: "Certification not found" });
    return;
  }

  await prisma.certification.delete({ where: { id: existing.id } });

  res.status(204).send();
});
