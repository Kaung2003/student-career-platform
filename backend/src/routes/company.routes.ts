import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireEmployer } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { HttpError, parse } from "../lib/http.js";
import { companySearchLimiter, signupLimiter } from "../lib/rate-limit.js";
import { email, optionalText, password, personName } from "../lib/schemas.js";
import { isFreeEmail, withoutPlusTag } from "../lib/company.js";
import { searchStudents } from "../lib/student-search.js";
import { SALT_ROUNDS, sendVerificationEmail } from "./auth.routes.js";

export const companyRouter = Router();

const companyName = z.string().trim().min(1, "is required").max(120, "must be at most 120 characters");

/** The company's site, as a full link. People usually type just "example.co.jp". */
const website = z
  .string()
  .trim()
  .max(300, "must be at most 300 characters")
  .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
  .refine((v) => {
    try {
      return new URL(v).hostname.includes(".");
    } catch {
      return false;
    }
  }, "must be a valid website address");

const registerSchema = z.strictObject({ name: personName, email, password, companyName, website });

/** True for "+" versions of an admin's own address, so admins can test the company panel. */
async function isAdminTestAddress(address: string) {
  const base = withoutPlusTag(address);
  if (!base) return false;
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", email: { equals: base, mode: "insensitive" } } });
  return Boolean(admin);
}

/** Company sign-up: confirms the email like any account, then waits for an admin to approve the company. */
companyRouter.post("/register", signupLimiter, async (req, res) => {
  const body = parse(registerSchema, req.body);

  if (isFreeEmail(body.email) && !(await isAdminTestAddress(body.email))) {
    throw new HttpError(400, "Please use your company email address, not a free address like Gmail.", "WORK_EMAIL_REQUIRED");
  }
  const existing = await prisma.user.findFirst({ where: { email: { equals: body.email, mode: "insensitive" } } });
  if (existing) {
    throw new HttpError(409, "An account with that email already exists. Log in instead.");
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: await bcrypt.hash(body.password, SALT_ROUNDS),
      role: "EMPLOYER",
      company: { create: { name: body.companyName, website: body.website } },
    },
  });
  await sendVerificationEmail(user);

  res.status(201).json({ verificationRequired: true, email: user.email });
});

companyRouter.use(requireAuth, requireEmployer);

companyRouter.get("/me", async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.auth!.userId } });
  res.json({ company });
});

const profileSchema = z.object({
  name: companyName,
  website,
  industry: optionalText(80),
  location: optionalText(120),
  description: optionalText(2000),
});

/** Saves the company's details. Changing who the company claims to be sends it back for review. */
companyRouter.put("/me", async (req, res) => {
  const body = parse(profileSchema, req.body);
  const userId = req.auth!.userId;
  const current = await prisma.company.findUnique({ where: { userId } });

  const identityChanged = !current || current.name !== body.name || current.website !== body.website;
  const backToReview = identityChanged || current.status === "REJECTED";

  const company = await prisma.company.upsert({
    where: { userId },
    create: { ...body, userId },
    update: { ...body, ...(backToReview ? { status: "PENDING" as const, reviewNote: null, reviewedAt: null } : {}) },
  });
  res.json({ company });
});

/** Student data is only for companies an admin has checked. */
async function approvedCompany(userId: string) {
  const company = await prisma.company.findUnique({ where: { userId }, select: { id: true, status: true } });
  if (company?.status !== "APPROVED") {
    throw new HttpError(403, "Your company needs to be approved before you can search for students.", "COMPANY_NOT_APPROVED");
  }
  return company;
}

const searchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  school: z.string().trim().max(120).optional(),
  // Comma-separated, e.g. "React,Python". A student needs all of them.
  skills: z
    .string()
    .max(300)
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10))
    .optional(),
  gradYear: z.coerce.number().int().min(1950).max(2100).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

/** Finds students who chose to be visible. Results never include contact details. */
companyRouter.get("/students", companySearchLimiter, async (req, res) => {
  const company = await approvedCompany(req.auth!.userId);
  const filters = parse(searchSchema, req.query);

  const result = await searchStudents(filters);

  if (filters.page === 1) {
    await prisma.companyActivity.create({ data: { type: "SEARCH", companyId: company.id } });
  }
  res.json(result);
});
