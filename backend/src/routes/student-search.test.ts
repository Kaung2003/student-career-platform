import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app, resetDatabase, signUp } from "../test/helpers.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/email.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/email.js")>()),
  sendEmail: async () => {},
}));

async function approvedCompanyAgent(status: "APPROVED" | "PENDING" = "APPROVED") {
  const email = `hr-${status.toLowerCase()}@acme.example`;
  const password = "long-enough-pw";
  await request(app)
    .post("/api/company/register")
    .send({ name: "Hana", email, password, companyName: "Acme", website: "acme.example" })
    .expect(201);
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  await prisma.company.update({ where: { userId: user.id }, data: { status } });
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email, password }).expect(200);
  return agent;
}

async function student(name: string, fields: Record<string, unknown>, visible = true) {
  const account = await signUp({ name });
  await account.agent.put("/api/profile/me").send(fields).expect(200);
  if (visible) await account.agent.put("/api/profile/me/visibility").send({ visible: true }).expect(200);
  return account;
}

const names = (res: { body: { students: { name: string }[] } }) => res.body.students.map((s) => s.name).sort();

beforeEach(resetDatabase);

describe("student visibility", () => {
  it("hides students until they choose to appear, and again when they stop", async () => {
    const company = await approvedCompanyAgent();
    const { agent } = await student("Ada", { headline: "Engineer" }, false);

    expect((await company.get("/api/company/students")).body.students).toEqual([]);

    const on = await agent.put("/api/profile/me/visibility").send({ visible: true });
    expect(on.body.profile.companyVisibleSince).toBeTruthy();
    expect(names(await company.get("/api/company/students"))).toEqual(["Ada"]);

    const { slug } = await agent.get("/api/profile/me").then((r) => r.body.profile);
    expect((await request(app).get(`/api/public/${slug}`)).body.openToWork).toBe(true);

    await agent.put("/api/profile/me/visibility").send({ visible: false }).expect(200);
    expect((await company.get("/api/company/students")).body.students).toEqual([]);
    expect((await request(app).get(`/api/public/${slug}`)).body.openToWork).toBe(false);
  });

  it("keeps the date the student first agreed", async () => {
    const { agent } = await student("Ada", {});
    const first = (await agent.get("/api/profile/me")).body.profile.companyVisibleSince;
    const again = await agent.put("/api/profile/me/visibility").send({ visible: true });
    expect(again.body.profile.companyVisibleSince).toBe(first);
  });

  it("includes admins who opted in, since admins here are students too", async () => {
    const company = await approvedCompanyAgent();
    const { agent } = await signUp({ name: "Admin Student", role: "ADMIN" });
    await agent.put("/api/profile/me/visibility").send({ visible: true }).expect(200);
    expect(names(await company.get("/api/company/students"))).toEqual(["Admin Student"]);
  });

  it("leaves out suspended students", async () => {
    const company = await approvedCompanyAgent();
    const { user } = await student("Ada", {});
    await prisma.user.update({ where: { id: user.id }, data: { suspended: true } });
    expect((await company.get("/api/company/students")).body.students).toEqual([]);
  });
});

describe("who can search", () => {
  it("is only approved companies", async () => {
    expect((await request(app).get("/api/company/students")).status).toBe(401);

    const { agent: studentAgent } = await signUp();
    expect((await studentAgent.get("/api/company/students")).status).toBe(403);

    const pending = await approvedCompanyAgent("PENDING");
    const res = await pending.get("/api/company/students");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("COMPANY_NOT_APPROVED");
    expect(await prisma.companyActivity.count()).toBe(0);
  });

  it("stops as soon as a company goes back to review", async () => {
    const company = await approvedCompanyAgent();
    await company.get("/api/company/students").expect(200);
    await prisma.company.updateMany({ data: { status: "PENDING" } });
    await company.get("/api/company/students").expect(403);
  });

  it("doesn't let a company post comments on a student's portfolio", async () => {
    const company = await approvedCompanyAgent();
    const { slug } = await student("Ada", {});
    expect((await company.post(`/api/public/${slug}/comments`).send({ body: "Join us!" })).status).toBe(403);
  });

  it("doesn't let a company change a student's visibility", async () => {
    const company = await approvedCompanyAgent();
    expect((await company.put("/api/profile/me/visibility").send({ visible: true })).status).toBe(403);
  });
});

describe("search results", () => {
  it("never include contact details or transcripts", async () => {
    const company = await approvedCompanyAgent();
    const { user } = await student("Ada", {
      headline: "Engineer",
      transcriptUrl: "https://files.example/secret-transcript.pdf",
      resumeUrl: "https://files.example/resume.pdf",
    });

    const res = await company.get("/api/company/students");
    expect(Object.keys(res.body.students[0]).sort()).toEqual(["gradYear", "headline", "name", "projectCount", "school", "skills", "slug"]);
    expect(JSON.stringify(res.body)).not.toContain(user.email);
    expect(JSON.stringify(res.body)).not.toContain("secret-transcript");
  });

  it("filter by words, skills, school and graduation year", async () => {
    const company = await approvedCompanyAgent();
    await student("Ada", { headline: "Backend engineer", school: "東京工業大学", gradYear: 2027, skills: ["React", "Python"] });
    await student("Grace", { headline: "Designer", school: "Kyoto University", gradYear: 2028, skills: ["Figma"] });

    const search = async (query: Record<string, string | number>) => names(await company.get("/api/company/students").query(query));

    expect(await search({ q: "backend" })).toEqual(["Ada"]);
    expect(await search({ q: "東京" })).toEqual(["Ada"]);
    expect(await search({ q: "react 東京" })).toEqual(["Ada"]);
    expect(await search({ q: "react kyoto" })).toEqual([]);
    expect(await search({ skills: "python,REACT" })).toEqual(["Ada"]);
    expect(await search({ skills: "python,figma" })).toEqual([]);
    expect(await search({ school: "kyoto" })).toEqual(["Grace"]);
    expect(await search({ gradYear: 2028 })).toEqual(["Grace"]);
  });

  it("treat % and _ as ordinary characters", async () => {
    const company = await approvedCompanyAgent();
    await student("Ada", { headline: "Engineer" });
    expect((await company.get("/api/company/students").query({ q: "%" })).body.students).toEqual([]);
    expect((await company.get("/api/company/students").query({ q: "_" })).body.students).toEqual([]);
  });

  it("come in pages", async () => {
    const company = await approvedCompanyAgent();
    const user = await signUp({ name: "Template" });
    await user.agent.put("/api/profile/me/visibility").send({ visible: true }).expect(200);
    for (let i = 0; i < 20; i++) {
      const created = await prisma.user.create({ data: { name: `S${i}`, email: `s${i}@example.test`, emailVerified: new Date() } });
      await prisma.studentProfile.create({ data: { userId: created.id, slug: `s-${i}`, companyVisibleSince: new Date() } });
    }

    const first = await company.get("/api/company/students");
    expect(first.body.students).toHaveLength(20);
    expect(first.body.hasMore).toBe(true);

    const second = await company.get("/api/company/students").query({ page: 2 });
    expect(second.body.students).toHaveLength(1);
    expect(second.body.hasMore).toBe(false);
  });
});

describe("usage numbers", () => {
  it("count searches and views by approved companies, without saving search text", async () => {
    const company = await approvedCompanyAgent();
    const { slug } = await student("Ada", { headline: "Engineer" });

    await company.get("/api/company/students").query({ q: "private search words" }).expect(200);
    await company.get("/api/company/students").query({ page: 2 }).expect(200); // the same search, next page
    await company.get(`/api/public/${slug}`).expect(200);
    await vi.waitFor(async () => expect(await prisma.companyActivity.count({ where: { type: "VIEW" } })).toBe(1));

    expect(await prisma.companyActivity.count({ where: { type: "SEARCH" } })).toBe(1);

    const { agent: admin } = await signUp({ role: "ADMIN" });
    const stats = await admin.get("/api/admin/stats");
    expect(stats.body.outcomes).toMatchObject({ visibleStudents: 1, approvedCompanies: 1, companySearches: 1, companyViews: 1 });
    expect(JSON.stringify(await prisma.companyActivity.findMany())).not.toContain("private search words");
  });
});
