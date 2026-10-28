// Applies database migrations on deploy.
// Databases created before migrations existed (with `prisma db push`) are "baselined" first:
// the 0_init migration is marked as already applied so only newer migrations run.
import "dotenv/config";
import { execSync } from "child_process";
import { prisma } from "../src/lib/prisma.js";

const rows = await prisma.$queryRaw<{ users: string | null; migrations: string | null }[]>`
  SELECT to_regclass('public."User"')::text AS users, to_regclass('public."_prisma_migrations"')::text AS migrations
`;
await prisma.$disconnect();

const { users, migrations } = rows[0] ?? { users: null, migrations: null };

if (users && !migrations) {
  console.log("Existing database without migration history — marking 0_init as applied.");
  execSync("npx prisma migrate resolve --applied 0_init", { stdio: "inherit" });
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });
