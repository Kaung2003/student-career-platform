import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app, resetDatabase, signUp } from "../test/helpers.js";
import { prisma } from "../lib/prisma.js";
import { signAuthToken } from "../lib/jwt.js";

const sentEmails: { to: string; text: string }[] = [];
let emailProviderDown = false;
vi.mock("../lib/email.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/email.js")>()),
  sendEmail: async (to: string, _subject: string, text: string) => {
    if (emailProviderDown) throw new Error("Connection timeout");
    sentEmails.push({ to, text });
  },
}));

let googleIdentity: { googleId: string; email: string; name: string } | null = null;
vi.mock("../lib/google.js", () => ({
  googleClientId: () => "test-client-id.apps.googleusercontent.com",
  verifyGoogleCredential: async () => googleIdentity,
}));

const linkToken = (text: string) => /token=([\w-]+)/.exec(text)?.[1];

beforeEach(async () => {
  await resetDatabase();
  sentEmails.length = 0;
  emailProviderDown = false;
});

describe("registration with a password", () => {
  it("creates the account and portfolio but requires confirming the email first", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada Lovelace", email: "Ada@Example.test", password: "analytical-engine" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ verificationRequired: true, email: "ada@example.test" });
    expect(res.headers["set-cookie"]).toBeUndefined();

    const profile = await prisma.studentProfile.findFirst({ where: { user: { email: "ada@example.test" } } });
    expect(profile?.slug).toBe("ada-lovelace");

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]!.to).toBe("ada@example.test");
    expect(sentEmails[0]!.text).toMatch(/verify-email\?token=/);

    const login = await request(app).post("/api/auth/login").send({ email: "ada@example.test", password: "analytical-engine" });
    expect(login.status).toBe(403);
    expect(login.body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("confirms the email from the link and logs the user in", async () => {
    await request(app).post("/api/auth/register").send({ name: "Grace", email: "grace@example.test", password: "cobol-forever" });
    const token = linkToken(sentEmails[0]!.text);

    const agent = request.agent(app);
    const verify = await agent.post("/api/auth/verify-email").send({ token });
    expect(verify.status).toBe(200);
    expect(verify.body.user).toMatchObject({ email: "grace@example.test", hasPassword: true });
    expect(verify.headers["set-cookie"]?.[0]).toMatch(/^scp_session=.*HttpOnly/i);
    expect((await agent.get("/api/auth/me")).status).toBe(200);

    // The link only works once.
    expect((await request(app).post("/api/auth/verify-email").send({ token })).status).toBe(400);

    const login = await request(app).post("/api/auth/login").send({ email: "grace@example.test", password: "cobol-forever" });
    expect(login.status).toBe(200);
  });

  it("still signs up instantly when the email provider is down", async () => {
    emailProviderDown = true;
    const res = await request(app).post("/api/auth/register").send({ name: "Mo", email: "mo@example.test", password: "long-enough-pw" });
    expect(res.status).toBe(201);
    // The link was still created, so "Resend email" can deliver it once email works again.
    expect(await prisma.emailVerificationToken.count()).toBe(1);
  });

  it("resends the link only for unconfirmed accounts", async () => {
    await request(app).post("/api/auth/register").send({ name: "Lin", email: "lin@example.test", password: "long-enough-pw" });
    await request(app).post("/api/auth/resend-verification").send({ email: "lin@example.test" }).expect(200);
    expect(sentEmails).toHaveLength(2);

    await request(app).post("/api/auth/resend-verification").send({ email: "nobody@example.test" }).expect(200);
    expect(sentEmails).toHaveLength(2);
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

describe("sign in with Google", () => {
  it("creates a verified account with no password and logs in", async () => {
    googleIdentity = { googleId: "g-123", email: "alan@gmail.com", name: "Alan Turing" };
    const agent = request.agent(app);

    const res = await agent.post("/api/auth/google").send({ credential: "x".repeat(40) });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: "alan@gmail.com", name: "Alan Turing", hasPassword: false });
    expect((await agent.get("/api/auth/me")).status).toBe(200);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "alan@gmail.com" } });
    expect(user.emailVerified).not.toBeNull();
    expect(await prisma.studentProfile.count({ where: { userId: user.id } })).toBe(1);

    // Password login explains that this account uses Google.
    const pw = await request(app).post("/api/auth/login").send({ email: "alan@gmail.com", password: "anything-here" });
    expect(pw.body.code).toBe("USE_GOOGLE");
  });

  it("links to an existing password account with the same email, and confirms it", async () => {
    await request(app).post("/api/auth/register").send({ name: "Kat", email: "kat@gmail.com", password: "long-enough-pw" });
    googleIdentity = { googleId: "g-kat", email: "kat@gmail.com", name: "Katherine" };

    const res = await request(app).post("/api/auth/google").send({ credential: "x".repeat(40) });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: "kat@gmail.com", name: "Kat", hasPassword: true });
    expect(await prisma.user.count({ where: { email: "kat@gmail.com" } })).toBe(1);

    // Google proved the address, so the password login now works too.
    const login = await request(app).post("/api/auth/login").send({ email: "kat@gmail.com", password: "long-enough-pw" });
    expect(login.status).toBe(200);
  });

  it("rejects tokens Google won't vouch for", async () => {
    googleIdentity = null;
    const res = await request(app).post("/api/auth/google").send({ credential: "x".repeat(40) });
    expect(res.status).toBe(401);
  });

  it("lets a Google-only account set a password and delete itself by typing its email", async () => {
    googleIdentity = { googleId: "g-del", email: "del@gmail.com", name: "Del" };
    const agent = request.agent(app);
    await agent.post("/api/auth/google").send({ credential: "x".repeat(40) }).expect(200);

    expect((await agent.delete("/api/account").send({ confirmEmail: "wrong@gmail.com" })).status).toBe(400);
    expect((await agent.delete("/api/account").send({ confirmEmail: "DEL@gmail.com" })).status).toBe(204);
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
    sentEmails.length = 0; // ignore the sign-up confirmation email

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
