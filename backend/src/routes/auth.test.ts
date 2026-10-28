import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app, resetDatabase, signUp } from "../test/helpers.js";
import { prisma } from "../lib/prisma.js";
import { signAuthToken } from "../lib/jwt.js";

const sentEmails: { to: string; text: string }[] = [];
vi.mock("../lib/email.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/email.js")>()),
  sendEmail: async (to: string, _subject: string, text: string) => {
    sentEmails.push({ to, text });
  },
}));

beforeEach(async () => {
  await resetDatabase();
  sentEmails.length = 0;
});

describe("registration", () => {
  it("creates an account, a portfolio, and an httpOnly session cookie", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada Lovelace", email: "Ada@Example.test", password: "analytical-engine" });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: "Ada Lovelace", email: "ada@example.test", role: "STUDENT" });
    expect(res.body.token).toBeUndefined();

    const cookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookie).toMatch(/^scp_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const profile = await prisma.studentProfile.findFirst({ where: { user: { email: "ada@example.test" } } });
    expect(profile?.slug).toBe("ada-lovelace");
  });

  it("rejects duplicate emails regardless of letter case", async () => {
    await signUp({ email: "dup@example.test" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Dup", email: "DUP@example.test", password: "long-enough-pw" });
    expect(res.status).toBe(409);
  });

  it("requires a valid email and a password of at least 8 characters", async () => {
    const badEmail = await request(app).post("/api/auth/register").send({ name: "A", email: "nope", password: "long-enough-pw" });
    expect(badEmail.status).toBe(400);
    expect(badEmail.body.error).toMatch(/email/);

    const shortPassword = await request(app).post("/api/auth/register").send({ name: "A", email: "a@b.test", password: "short" });
    expect(shortPassword.status).toBe(400);
    expect(shortPassword.body.error).toMatch(/password/);
  });

  it("never lets someone sign up as an admin", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Mallory", email: "m@example.test", password: "long-enough-pw", role: "ADMIN" });
    expect(res.status).toBe(400);
  });
});

describe("login and sessions", () => {
  it("logs in with the right password and rejects the wrong one", async () => {
    const { user, password } = await signUp();

    const wrong = await request(app).post("/api/auth/login").send({ email: user.email, password: "wrong-password" });
    expect(wrong.status).toBe(401);

    const agent = request.agent(app);
    const ok = await agent.post("/api/auth/login").send({ email: user.email.toUpperCase(), password });
    expect(ok.status).toBe(200);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.id).toBe(user.id);
  });

  it("logs out by clearing the cookie", async () => {
    const { agent } = await signUp();
    await agent.post("/api/auth/logout").expect(204);
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(401);
  });

  it("moves clients still using the old Authorization header onto the cookie", async () => {
    const { user } = await signUp();
    const token = signAuthToken({ userId: user.id, role: "STUDENT" });

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^scp_session=/);
  });

  it("locks suspended users out immediately, even with an existing session", async () => {
    const { agent, user, password } = await signUp();
    await prisma.user.update({ where: { id: user.id }, data: { suspended: true } });

    expect((await agent.get("/api/profile/me")).status).toBe(403);
    expect((await request(app).post("/api/auth/login").send({ email: user.email, password })).status).toBe(403);
  });
});

describe("password reset", () => {
  it("emails a one-time link that sets a new password", async () => {
    const { user } = await signUp();

    const forgot = await request(app).post("/api/auth/forgot-password").send({ email: user.email });
    expect(forgot.status).toBe(200);
    expect(sentEmails).toHaveLength(1);

    const token = /token=([\w-]+)/.exec(sentEmails[0]!.text)?.[1];
    expect(token).toBeTruthy();

    const reset = await request(app).post("/api/auth/reset-password").send({ token, password: "brand-new-password" });
    expect(reset.status).toBe(200);

    const login = await request(app).post("/api/auth/login").send({ email: user.email, password: "brand-new-password" });
    expect(login.status).toBe(200);

    const reuse = await request(app).post("/api/auth/reset-password").send({ token, password: "another-password" });
    expect(reuse.status).toBe(400);
  });

  it("answers the same way for unknown emails, without sending anything", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "nobody@example.test" });
    expect(res.status).toBe(200);
    expect(sentEmails).toHaveLength(0);
  });
});
