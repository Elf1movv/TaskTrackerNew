import { defineConfig } from "vite"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"

function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "")
        return path.resolve(__dirname, "src/assets", filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react({ jsxImportSource: "@emotion/react" }),
    tailwindcss(),
  ],
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
})
