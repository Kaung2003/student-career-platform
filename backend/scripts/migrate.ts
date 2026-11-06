// Applies database migrations on deploy.
// Databases created before migrations existed (with `prisma db push`) are "baselined" first:
// the 0_init migration is marked as already applied so only newer migrations run.
import "dotenv/config";
import { execSync } from "child_process";
import { prisma } from "../src/lib/prisma.js";

/**
 * Migrations take a database lock, which doesn't work reliably through Neon's connection pooler
 * (hosts ending in "-pooler"). They run over the direct connection instead; the app keeps the pooler.
 * DIRECT_DATABASE_URL overrides this when the direct address is different.
 */
function migrationUrl(url: string | undefined) {
  if (process.env["DIRECT_DATABASE_URL"]) return process.env["DIRECT_DATABASE_URL"];
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.hostname = parsed.hostname.replace("-pooler.", ".");
    return parsed.toString();
  } catch {
    return url;
  }
}

// Prisma's migration lock is skipped: a lock taken through the pooler earlier was never released,
// so waiting on it fails every deploy. Render builds one deploy at a time, so nothing else migrates at once.
const env = { ...process.env, DATABASE_URL: migrationUrl(process.env["DATABASE_URL"]), PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1" };

/** Runs a Prisma command, retrying once: a lock timeout usually means another deploy just finished. */
function run(command: string) {
  try {
    execSync(command, { stdio: "inherit", env });
  } catch {
    console.log("Retrying in 15 seconds...");
    execSync("sleep 15", { stdio: "inherit" });
    execSync(command, { stdio: "inherit", env });
  }
}

const rows = await prisma.$queryRaw<{ users: string | null; migrations: string | null }[]>`
  SELECT to_regclass('public."User"')::text AS users, to_regclass('public."_prisma_migrations"')::text AS migrations
`;
await prisma.$disconnect();

const { users, migrations } = rows[0] ?? { users: null, migrations: null };

if (users && !migrations) {
  console.log("Existing database without migration history — marking 0_init as applied.");
  run("npx prisma migrate resolve --applied 0_init");
}

run("npx prisma migrate deploy");
