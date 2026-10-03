import { Router } from "express"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createTaskSchema, reorderSchema, updateTaskSchema } from "../validation/task.js"

export const tasksRouter = Router()

tasksRouter.use(requireAuth)

import type { Task } from "@prisma/client"
import { checkGoal, fail, isFuture, localClock, ownerTransaction, removeTask } from "../lib/productLogic.js"
export function toClientTask(task: Task) {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    priority: task.priority,
    category: task.category,
    dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
    time: task.time,
    endTime: task.endTime,
    description: task.description,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    goalId: task.goalId,
    legacyPending: task.legacyPending,
  }
}

tasksRouter.get("/", async (req, res) => {
  const tasks = await db.task.findMany({
    where: { userId: req.userId, retiredAt: null },
    orderBy: { order: "asc" },
  })
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
  const created = await ownerTransaction(req.userId, async tx => {
    await checkGoal(tx, req.userId, parsed.data.goalId)
    const { _max } = await tx.task.aggregate({ where: { userId: req.userId }, _max: { order: true } })
    return tx.task.create({ data: { ...parsed.data, userId: req.userId, order: (_max.order ?? -1) + 1 } })
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

  const result = await ownerTransaction(req.userId, async tx => {
    await checkGoal(tx, req.userId, patch.goalId)
    const current = await tx.task.findFirst({
      where: { id: req.params.id, userId: req.userId, retiredAt: null },
    })
    if (!current) fail(404, "Task not found")
    if (current.updatedAt.toISOString() !== expectedUpdatedAt) return { conflict: true, task: current }
    const data = { ...patch }
    if (patch.completed !== undefined && patch.completed !== current.completed)
      data.completedAt = patch.completed ? (patch.completedAt ?? new Date()) : null
    const task = await tx.task.update({ where: { id: current.id }, data })
    return { conflict: false, task }
  })
  if (result.conflict) {
    res.status(409).json({ error: "Task changed elsewhere", current: toClientTask(result.task) })
    return
  }
  res.json(toClientTask(result.task))
})

tasksRouter.get("/:id/deletion-preview", async (req, res) => {
  const task = await db.task.findFirst({ where: { id: req.params.id, userId: req.userId, retiredAt: null } })
  if (!task) {
    res.status(404).json({ error: "Task not found" })
    return
  }
  const clock = localClock(req)
  const plans = await db.calendarPlan.findMany({ where: { taskId: task.id, userId: req.userId } })
  res.json({ futurePlans: plans.filter(p => isFuture(p.date, p.time, clock)).length })
})

tasksRouter.post("/:id/clear-future-plans", async (req, res) => {
  const clock = localClock(req)
  await ownerTransaction(req.userId, async tx => {
    const task = await tx.task.findFirst({
      where: { id: req.params.id, userId: req.userId, retiredAt: null },
    })
    if (!task) fail(404, "Task not found")
    if (!task.completed) fail(400, "Task is not completed")
    const plans = await tx.calendarPlan.findMany({ where: { taskId: task.id, userId: req.userId } })
    await tx.calendarPlan.deleteMany({
      where: {
        id: { in: plans.filter(p => isFuture(p.date, p.time, clock)).map(p => p.id) },
        userId: req.userId,
      },
    })
  })
  res.status(204).end()
})

tasksRouter.delete("/:id", async (req, res) => {
  const clock = localClock(req)
  await ownerTransaction(req.userId, async tx => {
    const task = await tx.task.findFirst({
      where: { id: req.params.id, userId: req.userId, retiredAt: null },
    })
    if (!task) fail(404, "Task not found")
    await removeTask(tx, task, clock)
  })
  res.status(204).end()
})
