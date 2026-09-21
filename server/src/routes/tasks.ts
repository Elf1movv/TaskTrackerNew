import { Router } from "express"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createTaskSchema, reorderSchema, updateTaskSchema } from "../validation/task.js"

export const tasksRouter = Router()

tasksRouter.use(requireAuth)

// Shape the frontend's Task type expects — `order`/`userId` are DB-only and
// never leave the server. `updatedAt`/`createdAt` DO leave the server:
// `updatedAt` so the client can detect "this record changed elsewhere"
// before overwriting it (see PATCH /:id below); `createdAt` so
// selectTodayTasks.ts can tell "this undated task was made today" from
// "this undated task is from a previous day" — a bare `dueDate == null`
// check used to include every undated task forever (see LEARNING.md,
// 2026-09-21).
//
// `dueDate` is stored as a real SQL `date` (see schema.prisma) but the
// wire format stays the same "YYYY-MM-DD" string the client always used —
// this mapper is the only place that knows the DB column is now a Date.
function toClientTask(task: {
  id: string
  title: string
  completed: boolean
  priority: string
  category: string
  dueDate: Date | null
  completedAt: Date | null
  updatedAt: Date
  createdAt: Date
}) {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    priority: task.priority,
    category: task.category,
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    updatedAt: task.updatedAt,
    createdAt: task.createdAt,
  }
}

tasksRouter.get("/", async (req, res) => {
  const tasks = await db.task.findMany({ where: { userId: req.userId }, orderBy: { order: "asc" } })
  res.json(tasks.map(toClientTask))
})

tasksRouter.post("/", async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid task", details: parsed.error.flatten() })
    return
  }

  // New tasks are appended on the client (added tasks show up last), so
  // they need an order larger than everything currently stored — scoped
  // to this user's own tasks, not the whole table.
  const { _max } = await db.task.aggregate({ where: { userId: req.userId }, _max: { order: true } })
  const created = await db.task.create({
    data: { ...parsed.data, userId: req.userId, order: (_max.order ?? -1) + 1 },
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
  // edit from another device. updateMany (not update) with userId in the
  // where clause — a plain `update` would throw if the id belonged to
  // someone else instead of just matching zero rows.
  //
  // Sorted by id before building the transaction — two overlapping reorder
  // requests (e.g. a drag that fires more than one, or two tabs at once)
  // each touch the same rows; without a deterministic lock order Postgres
  // can deadlock one of them, which used to surface as a raw 500 (see
  // LEARNING.md, 2026-09-21).
  await db.$transaction(
    [...parsed.data]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(({ id, order }) => db.task.updateMany({ where: { id, userId: req.userId }, data: { order } })),
  )
  // Prisma's @updatedAt bumps updatedAt on every reordered row even though
  // only `order` changed — the client must learn the new values, or its
  // next per-item PATCH on any of these tasks will carry a stale
  // expectedUpdatedAt and get a false 409 "changed elsewhere".
  const updated = await db.task.findMany({
    where: { id: { in: parsed.data.map(d => d.id) }, userId: req.userId },
    select: { id: true, updatedAt: true },
  })
  res.json(updated)
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
  // "check updatedAt" and "apply the patch". userId is in the same WHERE,
  // not a separate check — a mismatch reads exactly like "not found",
  // never revealing that a task with this id exists but belongs to
  // someone else.
  const result = await db.task.updateMany({
    where: { id: req.params.id, userId: req.userId, updatedAt: new Date(expectedUpdatedAt) },
    data: patch,
  })

  if (result.count === 0) {
    // count === 0 means either the row doesn't exist (or isn't this
    // user's), or it exists but updatedAt didn't match — look it up once
    // more, still scoped to this user, to tell those apart.
    const current = await db.task.findFirst({ where: { id: req.params.id, userId: req.userId } })
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

tasksRouter.delete("/:id", async (req, res) => {
  const result = await db.task.deleteMany({ where: { id: req.params.id, userId: req.userId } })
  if (result.count === 0) {
    res.status(404).json({ error: "Task not found" })
    return
  }
  res.status(204).end()
})
