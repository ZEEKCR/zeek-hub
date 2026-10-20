import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts"],
    testTimeout: 20000,
    // Each file starts its own in-memory Postgres and applies every migration;
    // with many files in parallel that can take longer than the 10 s default.
    hookTimeout: 60000,
  },
});
