import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import cors from "cors"
import express from "express"
import helmet from "helmet"
import morgan from "morgan"
import { errorHandler } from "./middleware/errorHandler.js"
import { goalsRouter } from "./routes/goals.js"
import { habitsRouter } from "./routes/habits.js"
import { tasksRouter } from "./routes/tasks.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The app is single-origin in both dev (Vite's server.proxy) and prod
// (nginx serves the API and the built frontend from the same domain) — a
// browser talking to its own frontend never triggers CORS at all. This
// list only matters for a request whose Origin genuinely differs, so it's
// kept to exactly the domains this app is actually served from.
const ALLOWED_ORIGINS = ["https://mytracker.space", "https://www.mytracker.space"]

// Split out from index.ts so tests (supertest) can import the app without
// binding a real port — index.ts is the only place that calls .listen().
export function createApp() {
  const app = express()

  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"))
  app.use(helmet())
  app.use(cors({ origin: ALLOWED_ORIGINS }))
  app.use(express.json())

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true })
  })

  app.use("/api/tasks", tasksRouter)
  app.use("/api/goals", goalsRouter)
  app.use("/api/habits", habitsRouter)

  // Anything under /api/ that didn't match a route above is a genuine 404,
  // not a frontend route — return JSON here so it doesn't fall through to
  // the SPA fallback below and come back as an HTML page with a 200.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" })
  })

  // The built frontend (`npm run build` at the project root) lives in
  // ../../dist relative to this file — same relative depth whether this runs
  // from src/ (dev, via tsx) or dist/ (prod, after `tsc build`). Serving it
  // here means one process handles both the API and the site on one origin.
  const frontendDist = path.join(__dirname, "..", "..", "dist")
  const indexHtmlPath = path.join(frontendDist, "index.html")
  app.use(express.static(frontendDist))

  // SPA fallback: any request that didn't match an API route or a real static
  // file gets index.html instead, so React Router can handle client-side
  // routes like /tasks or /goals even on a hard refresh. Guarded by
  // existsSync because in local dev the frontend is served by Vite instead —
  // this file only shows up after a production build.
  app.use((_req, res) => {
    if (fs.existsSync(indexHtmlPath)) {
      res.sendFile(indexHtmlPath)
    } else {
      res.status(404).send("Not found")
    }
  })

  // Must be registered last — Express requires 4-arg error middleware to be
  // the final app.use, regardless of what precedes it.
  app.use(errorHandler)

  return app
}
