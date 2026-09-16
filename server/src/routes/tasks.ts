import { Router } from "express"
import { db } from "../db.js"
import { isPrismaNotFound } from "../lib/prismaErrors.js"
import { createTaskSchema, reorderSchema, updateTaskSchema } from "../validation/task.js"

export const tasksRouter = Router()

// Shape the frontend's Task type expects — the DB-only fields (order,
// createdAt, userId) never leave the server. `updatedAt` DOES leave the
// server now — the client needs it to detect "this record changed
// elsewhere" before overwriting it (see PATCH /:id below).
function toClientTask(task: {
  id: string
  title: string
  completed: boolean
  priority: string
  category: string
  dueDate: string | null
  updatedAt: Date
}) {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    priority: task.priority,
    category: task.category,
    dueDate: task.dueDate,
    updatedAt: task.updatedAt,
  }
}

tasksRouter.get("/", async (_req, res) => {
  const tasks = await db.task.findMany({ orderBy: { order: "asc" } })
  res.json(tasks.map(toClientTask))
})

tasksRouter.post("/", async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid task", details: parsed.error.flatten() })
    return
  }

  // New tasks are prepended on the client (added tasks show up first), so
  // they need an order smaller than everything currently stored.
  const { _min } = await db.task.aggregate({ _min: { order: true } })
  const created = await db.task.create({
    data: { ...parsed.data, order: (_min.order ?? 0) - 1 },
  })
  res.status(201).json(toClientTask(created))
})

// Registered before PATCH "/:id" — otherwise Express would match
// "/reorder" as :id="reorder" and this handler would never be reached.
tasksRouter.patch("/reorder", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reorder payload", details: parsed.error.flatten() })
    return
  }

  // Deliberately touches ONLY `order` for these rows, never the rest of the
  // record — a reorder from one device can't clobber a concurrent field
  // edit from another device.
  await db.$transaction(
    parsed.data.map(({ id, order }) => db.task.update({ where: { id }, data: { order } })),
  )
  res.status(204).end()
})

tasksRouter.patch("/:id", async (req, res) => {
  const parsed = updateTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid task patch", details: parsed.error.flatten() })
    return
  }
  const { patch, expectedUpdatedAt } = parsed.data

  // Atomic conditional update — the WHERE clause itself enforces the
  // concurrency check, so there's no read-then-write race window between
  // "check updatedAt" and "apply the patch".
  const result = await db.task.updateMany({
    where: { id: req.params.id, updatedAt: new Date(expectedUpdatedAt) },
    data: patch,
  })

  if (result.count === 0) {
    // count === 0 means either the row doesn't exist, or it exists but
    // updatedAt didn't match — look it up once more to tell those apart.
    const current = await db.task.findUnique({ where: { id: req.params.id } })
    if (!current) {
      res.status(404).json({ error: "Task not found" })
      return
    }
    res.status(409).json({ error: "Task was changed elsewhere", current: toClientTask(current) })
    return
  }

  const updated = await db.task.findUniqueOrThrow({ where: { id: req.params.id } })
  res.json(toClientTask(updated))
})

tasksRouter.delete("/:id", async (req, res, next) => {
  try {
    await db.task.delete({ where: { id: req.params.id } })
  } catch (err) {
    if (isPrismaNotFound(err)) {
      res.status(404).json({ error: "Task not found" })
      return
    }
    next(err)
    return
  }
  res.status(204).end()
})
