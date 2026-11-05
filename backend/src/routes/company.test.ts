import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app, resetDatabase, signUp } from "../test/helpers.js";
import { prisma } from "../lib/prisma.js";
import { drainEmailQueue } from "../lib/email-queue.js";

const sentEmails: { to: string; subject: string; text: string }[] = [];
vi.mock("../lib/email.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/email.js")>()),
  sendEmail: async (to: string, subject: string, text: string) => {
    sentEmails.push({ to, subject, text });
  },
}));

const details = {
  name: "Hana Sato",
  email: "hana@acme.example",
  password: "long-enough-pw",
  companyName: "Acme",
  website: "acme.example",
};

/** Registers a company, confirms its email through the link, and returns a logged-in agent. */
async function registerCompany(overrides: Partial<typeof details> = {}) {
  const res = await request(app).post("/api/company/register").send({ ...details, ...overrides });
  expect(res.status).toBe(201);
  await drainEmailQueue();
  const token = /token=([\w-]+)/.exec(sentEmails.at(-1)!.text)![1];
  const agent = request.agent(app);
  await agent.post("/api/auth/verify-email").send({ token }).expect(200);
  return agent;
}

beforeEach(async () => {
  await resetDatabase();
  sentEmails.length = 0;
});

describe("company sign-up", () => {
  it("creates a pending employer account with no student portfolio", async () => {
    const agent = await registerCompany();

    const me = await agent.get("/api/auth/me");
    expect(me.body.role).toBe("EMPLOYER");

    const { body } = await agent.get("/api/company/me");
    expect(body.company).toMatchObject({ name: "Acme", website: "https://acme.example", status: "PENDING" });
    expect(await prisma.studentProfile.count()).toBe(0);
  });

  it("requires a work email and a real website", async () => {
    const gmail = await request(app).post("/api/company/register").send({ ...details, email: "hana@gmail.com" });
    expect(gmail.status).toBe(400);
    expect(gmail.body.code).toBe("WORK_EMAIL_REQUIRED");

    const site = await request(app).post("/api/company/register").send({ ...details, website: "not a site" });
    expect(site.status).toBe(400);
    expect(await prisma.user.count()).toBe(0);
  });

  it("can't choose a role, and rejects an email already in use", async () => {
    const admin = await request(app).post("/api/company/register").send({ ...details, role: "ADMIN" });
    expect(admin.status).toBe(400);

    await signUp({ email: "hana@acme.example" });
    const dup = await request(app).post("/api/company/register").send({ ...details, email: "HANA@acme.example" });
    expect(dup.status).toBe(409);
  });
});

describe("separate panels", () => {
  it("keeps companies out of student features and admin", async () => {
    const agent = await registerCompany();
    for (const path of ["/api/profile/me", "/api/projects", "/api/certifications", "/api/interview/questions"]) {
      expect((await agent.get(path)).status).toBe(403);
    }
    expect((await agent.post("/api/chat/stream").send({ message: "hi" })).status).toBe(403);
    expect((await agent.get("/api/admin/companies")).status).toBe(403);
  });

  it("keeps students out of the company panel", async () => {
    const { agent } = await signUp();
    expect((await agent.get("/api/company/me")).status).toBe(403);
    expect((await agent.put("/api/company/me").send({ name: "Fake", website: "fake.example" })).status).toBe(403);
    expect((await request(app).get("/api/company/me")).status).toBe(401);
  });
});

describe("admin review", () => {
  it("lists companies, flags a matching email, approves, and tells the company", async () => {
    const company = await registerCompany();
    const { agent: admin } = await signUp({ role: "ADMIN" });

    const list = await admin.get("/api/admin/companies?status=PENDING");
    expect(list.body.companies).toHaveLength(1);
    expect(list.body.companies[0]).toMatchObject({ contactEmail: details.email, emailConfirmed: true, emailMatchesWebsite: true });
    expect((await admin.get("/api/admin/stats")).body.totals.pendingCompanies).toBe(1);

    const id = list.body.companies[0].id;
    await admin.post(`/api/admin/companies/${id}/review`).send({ status: "APPROVED" }).expect(200);

    expect((await company.get("/api/company/me")).body.company.status).toBe("APPROVED");
    await drainEmailQueue();
    expect(sentEmails.at(-1)).toMatchObject({ to: details.email, subject: "Your company account is approved" });
    expect(await prisma.auditLog.count({ where: { action: "company.approved" } })).toBe(1);
  });

  it("won't approve a company whose email isn't confirmed", async () => {
    await request(app).post("/api/company/register").send(details).expect(201);
    const { agent: admin } = await signUp({ role: "ADMIN" });
    const { id } = await prisma.company.findFirstOrThrow();

    expect((await admin.post(`/api/admin/companies/${id}/review`).send({ status: "APPROVED" })).status).toBe(400);
  });

  it("shows the reason for a rejection, and resubmitting returns the company to review", async () => {
    const company = await registerCompany();
    const { agent: admin } = await signUp({ role: "ADMIN" });
    const { id } = await prisma.company.findFirstOrThrow();

    await admin.post(`/api/admin/companies/${id}/review`).send({ status: "REJECTED", note: "Website not found" }).expect(200);
    expect((await company.get("/api/company/me")).body.company).toMatchObject({ status: "REJECTED", reviewNote: "Website not found" });

    const resubmit = await company.put("/api/company/me").send({ name: "Acme", website: "https://acme.example" });
    expect(resubmit.body.company).toMatchObject({ status: "PENDING", reviewNote: null });
  });

  it("re-reviews an approved company only when its name or website changes", async () => {
    const company = await registerCompany();
    const { agent: admin } = await signUp({ role: "ADMIN" });
    const { id } = await prisma.company.findFirstOrThrow();
    await admin.post(`/api/admin/companies/${id}/review`).send({ status: "APPROVED" }).expect(200);

    const about = await company.put("/api/company/me").send({ name: "Acme", website: "https://acme.example", description: "We make things" });
    expect(about.body.company).toMatchObject({ status: "APPROVED", description: "We make things" });

    const renamed = await company.put("/api/company/me").send({ name: "Totally Different Inc", website: "https://acme.example" });
    expect(renamed.body.company.status).toBe("PENDING");
  });

  it("deletes the company along with the account", async () => {
    const company = await registerCompany();
    await company.delete("/api/account").send({ password: details.password }).expect(204);
    expect(await prisma.company.count()).toBe(0);
  });
});
