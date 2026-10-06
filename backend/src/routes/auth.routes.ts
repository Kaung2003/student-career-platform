import bcrypt from "bcrypt";
import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { prisma } from "../lib/prisma.js";
import { signAuthToken } from "../lib/jwt.js";
import { slugify, uniqueSlugFrom } from "../lib/slugify.js";
import { Role } from "../generated/prisma/enums.js";
import { ensureBootstrapAdmin } from "../lib/admin.js";

const SALT_ROUNDS = 10;

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body ?? {};

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "name, email and password are required" });
    return;
  }

  if (role !== undefined && (!Object.values(Role).includes(role) || role === Role.ADMIN)) {
    res.status(400).json({ error: `role must be one of: ${Object.values(Role).join(", ")}` });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "A user with that email already exists" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const created = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
  });
  const user = await ensureBootstrapAdmin(created);

  const slug = await uniqueSlugFrom(slugify(name));
  await prisma.studentProfile.create({ data: { userId: user.id, slug } });

  const token = signAuthToken({ userId: user.id, role: user.role });

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const found = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = found ? await bcrypt.compare(password, found.password) : false;

  if (!found || !passwordMatches) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (found.suspended) {
    res.status(403).json({ error: "This account has been suspended. Contact support for help." });
    return;
  }

  const user = await ensureBootstrapAdmin(found);

  const token = signAuthToken({ userId: user.id, role: user.role });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const found = await prisma.user.findUnique({ where: { id: req.auth!.userId } });

  if (!found) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = await ensureBootstrapAdmin(found);

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});
