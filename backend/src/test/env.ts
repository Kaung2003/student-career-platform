// Runs before each test file, before any app module reads process.env.
const testDb = process.env["TEST_DATABASE_URL"];
if (!testDb) {
  throw new Error("Set TEST_DATABASE_URL to a disposable Postgres database (it is wiped before every test).");
}
process.env["DATABASE_URL"] = testDb;
process.env["NODE_ENV"] = "test";
process.env["JWT_SECRET"] ??= "test-secret-test-secret-test-secret";
process.env["APP_URL"] = "http://app.test";
delete process.env["ADMIN_EMAILS"];
delete process.env["RESEND_API_KEY"];
// Tests must never call the real AI provider; chat tests mock it.
delete process.env["GEMINI_API_KEY"];
