import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globalSetup: ["src/test/global-setup.ts"],
    setupFiles: ["src/test/env.ts"],
    // All test files share one database, so run them one at a time.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});
