import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app, resetDatabase, signUp } from "../test/helpers.js";
import { prisma } from "../lib/prisma.js";

beforeEach(resetDatabase);

describe("profile", () => {
  it("saves validated fields and rejects unsafe links", async () => {
    const { agent } = await signUp();

    const ok = await agent
      .put("/api/profile/me")
      .send({ headline: "  CS student  ", skills: ["React", "react", "SQL"], github: "https://github.com/me", gradYear: 2027 });
    expect(ok.status).toBe(200);
    expect(ok.body.profile).toMatchObject({ headline: "CS student", skills: ["React", "SQL"], gradYear: 2027 });

    const unsafe = await agent.put("/api/profile/me").send({ website: "javascript:alert(1)" });
    expect(unsafe.status).toBe(400);
    expect(unsafe.body.error).toMatch(/website/);
  });

  it("refuses a portfolio URL someone else already has", async () => {
    const first = await signUp();
    const second = await signUp();
    const res = await second.agent.put("/api/profile/me").send({ slug: first.slug });
    expect(res.status).toBe(409);
  });
});

describe("projects", () => {
  it("lets the owner create, update and delete, and hides them from others", async () => {
    const owner = await signUp();
    const other = await signUp();

    const created = await owner.agent
      .post("/api/projects")
      .send({ title: "Campus App", techStack: ["React"], githubUrl: "https://github.com/me/app" });
    expect(created.status).toBe(201);
    const id = created.body.project.id;

    expect((await other.agent.put(`/api/projects/${id}`).send({ title: "Hacked" })).status).toBe(404);
    expect((await other.agent.delete(`/api/projects/${id}`)).status).toBe(404);

    const updated = await owner.agent.put(`/api/projects/${id}`).send({ title: "Campus Events App" });
    expect(updated.body.project.title).toBe("Campus Events App");

    expect((await owner.agent.delete(`/api/projects/${id}`)).status).toBe(204);
  });

  it("requires a title", async () => {
    const { agent } = await signUp();
    const res = await agent.post("/api/projects").send({ title: "   " });
    expect(res.status).toBe(400);
  });
});

describe("public portfolio", () => {
  it("counts one view per visitor per day and ignores the owner", async () => {
    const owner = await signUp();

    await request(app).get(`/api/public/${owner.slug}`).set("x-nf-client-connection-ip", "203.0.113.1").expect(200);
    await request(app).get(`/api/public/${owner.slug}`).set("x-nf-client-connection-ip", "203.0.113.1").expect(200);
    await request(app).get(`/api/public/${owner.slug}`).set("x-nf-client-connection-ip", "203.0.113.2").expect(200);
    await owner.agent.get(`/api/public/${owner.slug}`).expect(200);

    // View recording is fire-and-forget; give it a moment to land.
    await new Promise((r) => setTimeout(r, 200));

    const views = await owner.agent.get("/api/profile/me/views");
    expect(views.body.total).toBe(2);
    expect(views.body.daily).toHaveLength(14);
  });

  it("notifies the owner when someone comments", async () => {
    const owner = await signUp();
    const visitor = await signUp({ name: "Grace Hopper" });

    const res = await visitor.agent.post(`/api/public/${owner.slug}/comments`).send({ body: "Great work!" });
    expect(res.status).toBe(201);

    const notifications = await owner.agent.get("/api/notifications");
    expect(notifications.body.unread).toBe(1);
    expect(notifications.body.notifications[0]).toMatchObject({ type: "COMMENT", data: { name: "Grace Hopper" } });

    await owner.agent.post("/api/notifications/read-all").expect(204);
    expect((await owner.agent.get("/api/notifications")).body.unread).toBe(0);
  });

  it("hides suspended students", async () => {
    const owner = await signUp();
    await prisma.user.update({ where: { id: owner.user.id }, data: { suspended: true } });
    expect((await request(app).get(`/api/public/${owner.slug}`)).status).toBe(404);
  });
});
