import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import cors from "cors"
import express from "express"
import { goalsRouter } from "./routes/goals.js"
import { habitsRouter } from "./routes/habits.js"
import { tasksRouter } from "./routes/tasks.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

app.use("/api/tasks", tasksRouter)
app.use("/api/goals", goalsRouter)
app.use("/api/habits", habitsRouter)

// The built frontend (`npm run build` at the project root) lives in
// ../../dist relative to this file — same relative depth whether this runs
// from src/ (dev, via tsx) or dist/ (prod, after `tsc build`). Serving it
// here means one process handles both the API and the site on one origin —
// no CORS needed in production, nginx just proxies everything to this port.
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

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
