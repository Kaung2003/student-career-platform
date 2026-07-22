import { prisma } from "./prisma.js";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueSlugFrom(base: string): Promise<string> {
  const safeBase = base || "student";
  let candidate = safeBase;
  let attempt = 0;

  while (await prisma.studentProfile.findUnique({ where: { slug: candidate } })) {
    attempt += 1;
    candidate = `${safeBase}-${attempt}`;
  }

  return candidate;
}
