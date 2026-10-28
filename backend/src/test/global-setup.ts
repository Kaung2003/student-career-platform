import { execSync } from "child_process";

/** Brings the test database up to the latest migration once per run (non-destructive). */
export default function setup() {
  const url = process.env["TEST_DATABASE_URL"];
  if (!url) {
    throw new Error("Set TEST_DATABASE_URL to a disposable Postgres database (its tables are emptied before every test).");
  }
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
}
