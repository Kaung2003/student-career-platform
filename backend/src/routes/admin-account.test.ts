import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, signUp } from "../test/helpers.js";
import { prisma } from "../lib/prisma.js";

beforeEach(resetDatabase);

describe("admin panel", () => {
  it("is closed to students", async () => {
    const student = await signUp();
    expect((await student.agent.get("/api/admin/stats")).status).toBe(403);
  });

  it("changes roles, records it in the audit log, and protects the admin's own account", async () => {
    const admin = await signUp({ role: "ADMIN" });
    const student = await signUp();

    const promote = await admin.agent.patch(`/api/admin/users/${student.user.id}`).send({ role: "EMPLOYER" });
    expect(promote.status).toBe(200);

    const self = await admin.agent.patch(`/api/admin/users/${admin.user.id}`).send({ role: "STUDENT" });
    expect(self.status).toBe(400);

    const logs = await admin.agent.get("/api/admin/audit-logs");
    expect(logs.body.logs[0]).toMatchObject({ action: "user.role_changed", targetId: student.user.id });
  });

  it("notifies the author when their feedback is resolved", async () => {
    const admin = await signUp({ role: "ADMIN" });
    const student = await signUp();

    const created = await student.agent.post("/api/feedback").send({ type: "BUG", message: "Button is broken" });
    await admin.agent.patch(`/api/admin/feedback/${created.body.feedback.id}`).send({ status: "RESOLVED" }).expect(200);

    const notifications = await student.agent.get("/api/notifications");
    expect(notifications.body.notifications[0]).toMatchObject({ type: "FEEDBACK_UPDATE", data: { status: "RESOLVED" } });
  });
});

describe("account settings", () => {
  it("changes the password only with the current one", async () => {
    const { agent, password } = await signUp();

    const wrong = await agent.post("/api/account/password").send({ currentPassword: "nope", newPassword: "another-good-one" });
    expect(wrong.status).toBe(400);

    const ok = await agent.post("/api/account/password").send({ currentPassword: password, newPassword: "another-good-one" });
    expect(ok.status).toBe(200);
  });

  it("exports the user's data", async () => {
    const { agent, user } = await signUp();
    await agent.post("/api/certifications").send({ name: "AWS Cloud Practitioner" });

    const res = await agent.get("/api/account/export");
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.certifications).toHaveLength(1);
    expect(JSON.stringify(res.body)).not.toMatch(/"password"/);
  });

  it("deletes the account and everything in it", async () => {
    const { agent, user, password } = await signUp();
    await agent.post("/api/projects").send({ title: "Thing" });

    expect((await agent.delete("/api/account").send({ password: "wrong" })).status).toBe(400);
    expect((await agent.delete("/api/account").send({ password })).status).toBe(204);

    expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await prisma.project.count()).toBe(0);
  });

  it("won't let the last admin delete themselves", async () => {
    const admin = await signUp({ role: "ADMIN" });
    const res = await admin.agent.delete("/api/account").send({ password: admin.password });
    expect(res.status).toBe(400);
  });
});
