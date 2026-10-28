import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { HttpError, parse } from "../lib/http.js";
import { optionalText, optionalUrl } from "../lib/schemas.js";

export const certificationRouter = Router();

certificationRouter.use(requireAuth);

const certificationSchema = z.object({
  name: z.string().trim().min(1, "is required").max(120, "must be at most 120 characters"),
  provider: optionalText(120).optional(),
  examDate: z
    .string()
    .nullish()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "must be a valid date")
    .optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED"]).optional(),
  notes: optionalText(2000).optional(),
  resourceUrl: optionalUrl.optional(),
});

async function ownCertificationOr404(userId: string, id: string) {
  const existing = await prisma.certification.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new HttpError(404, "Certification not found");
  }
  return existing;
}

certificationRouter.get("/", async (req, res) => {
  const certifications = await prisma.certification.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ certifications });
});

certificationRouter.post("/", async (req, res) => {
  const body = parse(certificationSchema, req.body);

  const certification = await prisma.certification.create({
    data: {
      name: body.name,
      provider: body.provider ?? null,
      examDate: body.examDate ?? null,
      status: body.status ?? "PLANNING",
      notes: body.notes ?? null,
      resourceUrl: body.resourceUrl ?? null,
      userId: req.auth!.userId,
    },
  });

  res.status(201).json({ certification });
});

certificationRouter.put("/:id", async (req, res) => {
  const existing = await ownCertificationOr404(req.auth!.userId, req.params["id"] as string);
  const body = parse(certificationSchema.partial(), req.body);

  const certification = await prisma.certification.update({
    where: { id: existing.id },
    data: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)),
  });

  res.json({ certification });
});

certificationRouter.delete("/:id", async (req, res) => {
  const existing = await ownCertificationOr404(req.auth!.userId, req.params["id"] as string);
  await prisma.certification.delete({ where: { id: existing.id } });
  res.status(204).send();
});
