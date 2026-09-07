import cors from "cors"
import express from "express"
import { goalsRouter } from "./routes/goals.js"
import { habitsRouter } from "./routes/habits.js"
import { tasksRouter } from "./routes/tasks.js"

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

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
