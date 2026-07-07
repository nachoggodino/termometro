import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
      include: [
        "src/lib/domain/**/*.ts",
        "src/lib/i18n/app-copy.ts",
        "src/lib/i18n/config.ts",
        "src/lib/i18n/format.ts",
        "src/lib/i18n/messages/*.ts",
        "src/lib/server/report-security.ts",
      ],
    },
  },
});
