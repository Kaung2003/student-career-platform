import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "./prisma.js";

const PAGE_SIZE = 20;

export type StudentFilters = { q?: string | undefined; school?: string | undefined; skills?: string[] | undefined; gradYear?: number | undefined; page: number };

/** Makes user text match literally: % and _ would otherwise act as wildcards. */
const pattern = (text: string) => `%${text.replace(/[\\%_]/g, "\\$&")}%`;

const skillMatches = (text: string) => Prisma.sql`EXISTS (SELECT 1 FROM unnest(p."skills") AS skill WHERE skill ILIKE ${pattern(text)})`;

/**
 * Plain substring matching, on purpose: it also finds Japanese words, which Postgres's
 * word-based text search can't split up. At this size it's fast enough without an index.
 */
export async function searchStudents({ q, school, skills, gradYear, page }: StudentFilters) {
  const conditions = [
    Prisma.sql`p."companyVisibleSince" IS NOT NULL`,
    Prisma.sql`u."suspended" = false`,
    Prisma.sql`u."role" = 'STUDENT'`,
  ];

  // Every word has to match somewhere: "React 東京" finds a React student at a Tokyo school.
  for (const word of q?.split(/\s+/).filter(Boolean).slice(0, 5) ?? []) {
    const like = pattern(word);
    conditions.push(Prisma.sql`(
      u."name" ILIKE ${like} OR p."headline" ILIKE ${like} OR p."school" ILIKE ${like} OR p."bio" ILIKE ${like} OR ${skillMatches(word)}
    )`);
  }
  if (school) conditions.push(Prisma.sql`p."school" ILIKE ${pattern(school)}`);
  if (gradYear) conditions.push(Prisma.sql`p."gradYear" = ${gradYear}`);
  for (const skill of skills ?? []) conditions.push(skillMatches(skill));

  // One extra row tells us whether there's another page.
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p."id" FROM "StudentProfile" p
    JOIN "User" u ON u."id" = p."userId"
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY p."updatedAt" DESC, p."id"
    LIMIT ${PAGE_SIZE + 1} OFFSET ${(page - 1) * PAGE_SIZE}
  `;
  const ids = rows.slice(0, PAGE_SIZE).map((row) => row.id);

  const profiles = await prisma.studentProfile.findMany({
    where: { id: { in: ids } },
    include: { user: { select: { name: true } }, _count: { select: { projects: true } } },
  });
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));

  return {
    // Listed field by field so contact details and transcripts can't leak in.
    students: ids.flatMap((id) => {
      const profile = byId.get(id);
      return profile
        ? [
            {
              name: profile.user.name,
              slug: profile.slug,
              headline: profile.headline,
              school: profile.school,
              gradYear: profile.gradYear,
              skills: profile.skills,
              projectCount: profile._count.projects,
            },
          ]
        : [];
    }),
    hasMore: rows.length > PAGE_SIZE,
  };
}
