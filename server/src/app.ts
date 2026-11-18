import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { toNodeHandler } from "better-auth/node"
import compression from "compression"
import cors from "cors"
import express from "express"
import helmet from "helmet"
import morgan from "morgan"
import { auth } from "./auth.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { categoriesRouter } from "./routes/categories.js"
import { feedbackRouter } from "./routes/feedback.js"
import { goalsRouter } from "./routes/goals.js"
import { habitGroupsRouter } from "./routes/habitGroups.js"
import { habitsRouter } from "./routes/habits.js"
import { meRouter } from "./routes/me.js"
import { pushRouter } from "./routes/push.js"
import { remindersRouter } from "./routes/reminders.js"
import { notesRouter } from "./routes/notes.js"
import { plansRouter } from "./routes/plans.js"
import { tasksRouter } from "./routes/tasks.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The app is single-origin in both dev (Vite's server.proxy) and prod
// (nginx serves the API and the built frontend from the same domain) — a
// browser talking to its own frontend never triggers CORS at all. This
// list only matters for a request whose Origin genuinely differs, so it's
// kept to exactly the domains this app is actually served from.
const ALLOWED_ORIGINS = process.env.APP_ORIGINS?.split(",")
  .map(origin => origin.trim())
  .filter(Boolean) ?? ["https://mytracker.space", "https://www.mytracker.space"]

// Split out from index.ts so tests (supertest) can import the app without
// binding a real port — index.ts is the only place that calls .listen().
const SLOW_REQUEST_MS = 500

export function createApp() {
  const app = express()

  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"))
  // Slow answers in the log (speed iteration 2026-11-18): any request that took
  // over 500 ms. Method and path only — no query string, body or user. Read on
  // the server with `docker compose logs app | grep "slow request"`.
  app.use((req, res, next) => {
    const started = process.hrtime.bigint()
    res.on("finish", () => {
      const ms = Number((process.hrtime.bigint() - started) / 1_000_000n)
      if (ms > SLOW_REQUEST_MS)
        console.warn(`slow request ${req.method} ${req.originalUrl.split("?")[0]} ${res.statusCode} ${ms}ms`)
    })
    next()
  })
  app.use(helmet())
  // gzip/brotli for everything we send. The app bundle is ~1.45 MB as is;
  // compressed it's a few hundred KB. nginx in front doesn't compress what it
  // proxies (gzip_types / gzip_proxied are off there), and it passes our
  // compressed responses through untouched — owner: "loads 8-12 s", 2026-11-15.
  app.use(compression())
  app.use(cors({ origin: ALLOWED_ORIGINS }))

  // Registered before express.json() deliberately — Better Auth reads the
  // raw request body itself, and a body-parser mounted first would already
  // have consumed the stream by the time this handler runs.
  app.all("/api/auth/*splat", toNodeHandler(auth))

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true })
  })

  // Body-parser mounted per-router, not globally — a single global
  // express.json() runs ahead of every route's own requireAuth check, so
  // whatever limit it has is the real ceiling an UNauthenticated request
  // can force the server to parse before getting 401. Feedback is the one
  // route that genuinely needs a large limit (its optional base64
  // screenshot attachment, validated up to ~7MB in
  // validation/feedback.ts); everything else gets a small default instead
  // of inheriting feedback's 8mb just because they happen to share one
  // app.use(). Mounting each limit directly on its own router path (rather
  // than one global middleware followed by a second, larger one on
  // feedback's own path) also avoids the smaller limit rejecting
  // feedback's body before the larger one ever gets a chance to run.
  const DEFAULT_JSON_LIMIT = "256kb"
  app.use("/api/notes", express.json({ limit: DEFAULT_JSON_LIMIT }), notesRouter)
  app.use("/api/plans", express.json({ limit: DEFAULT_JSON_LIMIT }), plansRouter)
  app.use("/api/tasks", express.json({ limit: DEFAULT_JSON_LIMIT }), tasksRouter)
  app.use("/api/goals", express.json({ limit: DEFAULT_JSON_LIMIT }), goalsRouter)
  app.use("/api/habits", express.json({ limit: DEFAULT_JSON_LIMIT }), habitsRouter)
  app.use("/api/habit-groups", express.json({ limit: DEFAULT_JSON_LIMIT }), habitGroupsRouter)
  app.use("/api/categories", express.json({ limit: DEFAULT_JSON_LIMIT }), categoriesRouter)
  app.use("/api/reminders", express.json({ limit: DEFAULT_JSON_LIMIT }), remindersRouter)
  app.use("/api/feedback", express.json({ limit: "8mb" }), feedbackRouter)
  app.use("/api/me", express.json({ limit: DEFAULT_JSON_LIMIT }), meRouter)
  app.use("/api/push", express.json({ limit: DEFAULT_JSON_LIMIT }), pushRouter)

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
  app.use(
    express.static(frontendDist, {
      setHeaders(res, filePath) {
        // Vite puts a content hash in every file name under /assets
        // (index-BjtZ4kTC.js): a new build means a new name, so these can be
        // kept by the browser for a year without ever asking again — a
        // repeat launch on a phone downloads nothing. Everything else
        // (index.html, sw.js, manifest, icons) keeps the default: the browser
        // checks it each time, so a release shows up at once.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
        }
      },
    }),
  )

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
