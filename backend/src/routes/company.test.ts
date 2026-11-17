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
  corporateNumber: "7000012050002",
  acceptTerms: true,
};

/** Ticks the checks an admin must do, then approves. */
async function approve(admin: ReturnType<typeof request.agent>, id: string) {
  await admin.put(`/api/admin/companies/${id}/checks`).send({ checks: ["REGISTRY", "INSURANCE"] }).expect(200);
  await admin.post(`/api/admin/companies/${id}/review`).send({ status: "APPROVED" }).expect(200);
}

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
  it("requires agreeing to the terms for companies, and records when", async () => {
    const { acceptTerms: _, ...withoutTerms } = details;
    expect((await request(app).post("/api/company/register").send(withoutTerms)).status).toBe(400);
    expect((await request(app).post("/api/company/register").send({ ...details, acceptTerms: false })).status).toBe(400);

    await registerCompany();
    const company = await prisma.company.findFirstOrThrow();
    expect(company.termsAcceptedAt).toBeInstanceOf(Date);
  });

  it("lets an admin test with a \"+\" version of their own free address, and nobody else", async () => {
    const { user: admin } = await signUp({ email: "boss@gmail.com", role: "ADMIN" });
    expect(admin.email).toBe("boss@gmail.com");
    const { user: student } = await signUp({ email: "kid@gmail.com" });

    const ok = await request(app).post("/api/company/register").send({ ...details, email: "boss+company@gmail.com" });
    expect(ok.status).toBe(201);
    expect((await prisma.company.findFirstOrThrow()).status).toBe("PENDING");

    for (const email of [`${student.email.split("@")[0]}+co@gmail.com`, "stranger+co@gmail.com", "boss+x@yahoo.com"]) {
      const res = await request(app).post("/api/company/register").send({ ...details, email });
      expect(res.body.code, email).toBe("WORK_EMAIL_REQUIRED");
    }
  });

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

describe("corporate number (法人番号)", () => {
  it("must be a real 13-digit number, written any common way", async () => {
    for (const corporateNumber of ["", "123", "7000012050003", "abcdefghijklm"]) {
      expect((await request(app).post("/api/company/register").send({ ...details, corporateNumber })).status, corporateNumber).toBe(400);
    }
    await registerCompany({ corporateNumber: "７０００-０１２０-５０００２" });
    expect((await prisma.company.findFirstOrThrow()).corporateNumber).toBe("7000012050002");
  });

  it("can belong to only one account", async () => {
    await registerCompany();
    const again = await request(app).post("/api/company/register").send({ ...details, email: "someone@acme.example" });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe("CORPORATE_NUMBER_TAKEN");
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
    await approve(admin, id);

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

    const resubmit = await company.put("/api/company/me").send({ name: "Acme", website: "https://acme.example", corporateNumber: details.corporateNumber });
    expect(resubmit.body.company).toMatchObject({ status: "PENDING", reviewNote: null });
  });

  it("re-reviews an approved company only when its name or website changes", async () => {
    const company = await registerCompany();
    const { agent: admin } = await signUp({ role: "ADMIN" });
    const { id } = await prisma.company.findFirstOrThrow();
    await approve(admin, id);

    const about = await company.put("/api/company/me").send({ name: "Acme", website: "https://acme.example", corporateNumber: details.corporateNumber, description: "We make things" });
    expect(about.body.company).toMatchObject({ status: "APPROVED", description: "We make things" });

    const renamed = await company.put("/api/company/me").send({ name: "Totally Different Inc", website: "https://acme.example", corporateNumber: details.corporateNumber });
    expect(renamed.body.company).toMatchObject({ status: "PENDING", checks: [] });
  });

  it("won't approve until the registration and social insurance are checked", async () => {
    await registerCompany();
    const { agent: admin } = await signUp({ role: "ADMIN" });
    const { id } = await prisma.company.findFirstOrThrow();

    const none = await admin.post(`/api/admin/companies/${id}/review`).send({ status: "APPROVED" });
    expect(none.body.code).toBe("CHECKS_REQUIRED");
    await admin.put(`/api/admin/companies/${id}/checks`).send({ checks: ["REGISTRY"] }).expect(200);
    expect((await admin.post(`/api/admin/companies/${id}/review`).send({ status: "APPROVED" })).body.code).toBe("CHECKS_REQUIRED");
    expect((await admin.put(`/api/admin/companies/${id}/checks`).send({ checks: ["MADE_UP"] })).status).toBe(400);

    await approve(admin, id);
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "company.approved" } });
    expect(JSON.stringify(log)).toContain("INSURANCE");
  });

  it("only lets the admin change the checklist", async () => {
    const company = await registerCompany();
    const { id } = await prisma.company.findFirstOrThrow();
    expect((await company.put(`/api/admin/companies/${id}/checks`).send({ checks: ["REGISTRY", "INSURANCE"] })).status).toBe(403);
  });

  it("warns about a company that opens many portfolios in a day", async () => {
    await registerCompany();
    const { agent: admin } = await signUp({ role: "ADMIN" });
    const company = await prisma.company.findFirstOrThrow();

    await prisma.companyActivity.createMany({ data: Array.from({ length: 49 }, () => ({ type: "VIEW" as const, companyId: company.id })) });
    expect((await admin.get("/api/admin/stats")).body.companyAlerts).toEqual([]);

    await prisma.companyActivity.create({ data: { type: "VIEW", companyId: company.id } });
    expect((await admin.get("/api/admin/stats")).body.companyAlerts).toEqual([{ id: company.id, name: "Acme", views: 50 }]);
    const list = await admin.get("/api/admin/companies?status=PENDING");
    expect(list.body.companies[0].viewsLast24h).toBe(50);
  });

  it("deletes the company along with the account", async () => {
    const company = await registerCompany();
    await company.delete("/api/account").send({ password: details.password }).expect(204);
    expect(await prisma.company.count()).toBe(0);
  });
});
