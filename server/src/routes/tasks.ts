import { Router } from "express"
import { db } from "../db.js"

export const tasksRouter = Router()

// Shape the frontend's Task type expects — the DB-only fields (order,
// createdAt, updatedAt, userId) never leave the server. Array position in
// the response IS the order, matching how the frontend already treats it.
function toClientTask(task: {
  id: string
  title: string
  completed: boolean
  priority: string
  category: string
  dueDate: string | null
}) {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    priority: task.priority,
    category: task.category,
    dueDate: task.dueDate,
  }
}

tasksRouter.get("/", async (_req, res) => {
  const tasks = await db.task.findMany({ orderBy: { order: "asc" } })
  res.json(tasks.map(toClientTask))
})

// Replaces the whole collection with what the frontend sends — mirrors the
// existing Repository<T>.save(items) contract (see
// src/shared/lib/storage/repository.ts on the frontend) so no other
// frontend code needs to change for this first backend slice. Array index
// becomes the stored `order`.
tasksRouter.put("/", async (req, res) => {
  const tasks = req.body as Array<{
    id: string
    title: string
    completed: boolean
    priority: string
    category: string
    dueDate: string | null
  }>

  if (!Array.isArray(tasks)) {
    res.status(400).json({ error: "Expected an array of tasks" })
    return
  }

  await db.$transaction([
    db.task.deleteMany({}),
    db.task.createMany({
      data: tasks.map((task, index) => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
        priority: task.priority,
        category: task.category,
        dueDate: task.dueDate,
        order: index,
      })),
    }),
  ])

  res.json(tasks)
})
