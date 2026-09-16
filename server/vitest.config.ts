import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Tests share one Postgres test database and clean it between cases —
    // running test files in parallel would race on that cleanup.
    fileParallelism: false,
  },
})
