import fs from "fs"
import path from "path"
import type { Plugin } from "vite"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
// vitest/config re-exports Vite's defineConfig with an added `test` field,
// so build and test config can share the same plugins/aliases below instead
// of duplicating them in a separate vitest.config.ts.
import { defineConfig } from "vitest/config"

// The test site (VITE_APP_ENV=staging, see .github/workflows/staging.yml) gets
// orange icons and the name "MyTracker Тест", so the installed test app isn't
// confused with the real one on a phone (owner, 2026-11-15). The icons are
// made by scripts/make-staging-icons.mjs; production builds are untouched.
function stagingBranding(): Plugin {
  const staging = process.env.VITE_APP_ENV === "staging"
  let outDir = "dist"
  return {
    name: "staging-branding",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir
    },
    transformIndexHtml(html) {
      if (!staging) return html
      return html
        .replace(
          'name="apple-mobile-web-app-title" content="MyTracker"',
          'name="apple-mobile-web-app-title" content="MyTracker Тест"',
        )
        .replace("<title>MyTracker</title>", "<title>MyTracker Тест</title>")
    },
    closeBundle() {
      if (!staging) return
      fs.cpSync(path.resolve(__dirname, "staging-icons"), outDir, { recursive: true })
      const manifestPath = path.join(outDir, "manifest.webmanifest")
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
      manifest.name = "MyTracker Тест"
      manifest.short_name = "MT Тест"
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), stagingBranding()],
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"],

  server: {
    // In dev, the backend runs separately on :3001. In production, nginx
    // and Express serve everything from one origin, so VITE_API_URL is
    // just "/api" in both places — this proxy makes that same relative
    // path work in dev too, instead of needing a different value per
    // environment.
    proxy: {
      "/api": "http://localhost:3001",
    },
  },

  test: {
    environment: "jsdom",
    // Without an explicit include, Vitest scans the whole project and picks
    // up server/'s test files too — those run destructive Prisma calls
    // (deleteMany in beforeEach) and are only safe under server's own
    // vitest.config.ts, which enforces a dedicated test database via
    // server/vitest.setup.ts. Root's test run must never see them.
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
