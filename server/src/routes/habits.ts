import { Router } from "express"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createHabitSchema, reorderSchema, updateHabitSchema } from "../validation/habit.js"

export const habitsRouter = Router()

habitsRouter.use(requireAuth)

interface ClientHabit {
  id: string
  title: string
  icon: string
  color: string
  completedDates: string[]
  activeDays: number[]
  groupId: string
  updatedAt: Date
  createdAt: Date
}

function toClientHabit(habit: {
  id: string
  title: string
  icon: string
  color: string
  completedDates: string[]
  activeDays: number[]
  groupId: string
  updatedAt: Date
  createdAt: Date
}): ClientHabit {
  return {
    id: habit.id,
    title: habit.title,
    icon: habit.icon,
    color: habit.color,
    completedDates: habit.completedDates,
    activeDays: habit.activeDays,
    groupId: habit.groupId,
    updatedAt: habit.updatedAt,
    createdAt: habit.createdAt,
  }
}

habitsRouter.get("/", async (req, res) => {
  const habits = await db.habit.findMany({ where: { userId: req.userId }, orderBy: { order: "asc" } })
  res.json(habits.map(toClientHabit))
})

habitsRouter.post("/", async (req, res) => {
  const parsed = createHabitSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid habit", details: parsed.error.flatten() })
    return
  }

  // groupId is a real FK now (unlike Task.category's plain string) — a
  // client could otherwise point a habit at some other user's group id,
  // since Prisma alone won't check ownership, only that the row exists.
  const group = await db.habitGroup.findFirst({ where: { id: parsed.data.groupId, userId: req.userId } })
  if (!group) {
    res.status(400).json({ error: "Habit group not found" })
    return
  }

  // New habits are appended on the client (added habits show up last), so
  // they need an order larger than everything currently stored.
  const { _max } = await db.habit.aggregate({ where: { userId: req.userId }, _max: { order: true } })
  const created = await db.habit.create({
    data: { ...parsed.data, userId: req.userId, order: (_max.order ?? -1) + 1 },
  })
  res.status(201).json(toClientHabit(created))
})

habitsRouter.patch("/reorder", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reorder payload", details: parsed.error.flatten() })
    return
  }

  // Sorted by id — see the matching comment in routes/tasks.ts's reorder
  // handler for why (deterministic lock order avoids deadlocking
  // overlapping reorder transactions).
  await db.$transaction(
    [...parsed.data]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(({ id, order }) => db.habit.updateMany({ where: { id, userId: req.userId }, data: { order } })),
  )
  // Prisma's @updatedAt bumps updatedAt on every reordered row even though
  // only `order` changed — the client must learn the new values, or its
  // next per-item PATCH on any of these habits will carry a stale
  // expectedUpdatedAt and get a false 409 "changed elsewhere".
  const updated = await db.habit.findMany({
    where: { id: { in: parsed.data.map(d => d.id) }, userId: req.userId },
    select: { id: true, updatedAt: true },
  })
  res.json(updated)
})

habitsRouter.patch("/:id", async (req, res) => {
  const parsed = updateHabitSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid habit patch", details: parsed.error.flatten() })
    return
  }
  const { patch, expectedUpdatedAt } = parsed.data

  // Same ownership check as POST — only relevant when the patch actually
  // moves the habit to a different group.
  if (patch.groupId) {
    const group = await db.habitGroup.findFirst({ where: { id: patch.groupId, userId: req.userId } })
    if (!group) {
      res.status(400).json({ error: "Habit group not found" })
      return
    }
  }

  const result = await db.habit.updateMany({
    where: { id: req.params.id, userId: req.userId, updatedAt: new Date(expectedUpdatedAt) },
    data: patch,
  })

  if (result.count === 0) {
    const current = await db.habit.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!current) {
      res.status(404).json({ error: "Habit not found" })
      return
    }
    res.status(409).json({ error: "Habit was changed elsewhere", current: toClientHabit(current) })
    return
  }

  const updated = await db.habit.findUniqueOrThrow({ where: { id: req.params.id } })
  res.json(toClientHabit(updated))
})

habitsRouter.delete("/:id", async (req, res) => {
  const result = await db.habit.deleteMany({ where: { id: req.params.id, userId: req.userId } })
  if (result.count === 0) {
    res.status(404).json({ error: "Habit not found" })
    return
  }
  res.status(204).end()
})
