import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";

// One server bound to 127.0.0.1 for the whole file. Connecting by IP (not "localhost")
// avoids slow name lookups that made random tests stall on some machines.
const server = createApp().listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", () => resolve()));
server.unref();
const address = server.address();
if (!address || typeof address === "string") throw new Error("Test server failed to start");

/** Base URL of the test server; pass it to supertest's request() / request.agent(). */
export const app = `http://127.0.0.1:${address.port}`;

/** Empties every table so each test starts from a clean database. */
export async function resetDatabase() {
  // Safety net: only ever empty a database that is clearly meant for tests.
  const dbName = new URL(process.env["DATABASE_URL"] ?? "").pathname.slice(1);
  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to clear database "${dbName}": its name must contain "test".`);
  }
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
  }
}

let counter = 0;

/** Registers a user through the API and returns a supertest agent that keeps its session cookie. */
export async function signUp(overrides: { name?: string; email?: string; password?: string; role?: "ADMIN" } = {}) {
  counter += 1;
  const name = overrides.name ?? `Test User ${counter}`;
  const email = overrides.email ?? `user${counter}@example.test`;
  const password = overrides.password ?? "correct-horse-battery";

  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send({ name, email, password });
  if (res.status !== 201) {
    throw new Error(`signUp failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  // Skip the inbox step: mark the email confirmed, then log in for a session cookie.
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date(), ...(overrides.role === "ADMIN" ? { role: "ADMIN" } : {}) },
  });
  const login = await agent.post("/api/auth/login").send({ email, password });
  if (login.status !== 200) {
    throw new Error(`signUp login failed: ${login.status} ${JSON.stringify(login.body)}`);
  }

  const user = login.body.user as { id: string; name: string; email: string; role: string };
  const profile = await prisma.studentProfile.findUniqueOrThrow({ where: { userId: user.id } });
  return { agent, user, password, slug: profile.slug };
}
