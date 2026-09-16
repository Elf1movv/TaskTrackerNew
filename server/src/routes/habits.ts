import { Router } from "express"
import { db } from "../db.js"
import { isPrismaNotFound } from "../lib/prismaErrors.js"
import { createHabitSchema, reorderSchema, updateHabitSchema } from "../validation/habit.js"

export const habitsRouter = Router()

interface ClientHabit {
  id: string
  title: string
  icon: string
  color: string
  completedDates: string[]
  updatedAt: Date
}

function toClientHabit(habit: {
  id: string
  title: string
  icon: string
  color: string
  completedDates: string[]
  updatedAt: Date
}): ClientHabit {
  return {
    id: habit.id,
    title: habit.title,
    icon: habit.icon,
    color: habit.color,
    completedDates: habit.completedDates,
    updatedAt: habit.updatedAt,
  }
}

habitsRouter.get("/", async (_req, res) => {
  const habits = await db.habit.findMany({ orderBy: { order: "asc" } })
  res.json(habits.map(toClientHabit))
})

habitsRouter.post("/", async (req, res) => {
  const parsed = createHabitSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid habit", details: parsed.error.flatten() })
    return
  }

  const { _min } = await db.habit.aggregate({ _min: { order: true } })
  const created = await db.habit.create({
    data: { ...parsed.data, order: (_min.order ?? 0) - 1 },
  })
  res.status(201).json(toClientHabit(created))
})

habitsRouter.patch("/reorder", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reorder payload", details: parsed.error.flatten() })
    return
  }

  await db.$transaction(
    parsed.data.map(({ id, order }) => db.habit.update({ where: { id }, data: { order } })),
  )
  res.status(204).end()
})

habitsRouter.patch("/:id", async (req, res) => {
  const parsed = updateHabitSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid habit patch", details: parsed.error.flatten() })
    return
  }
  const { patch, expectedUpdatedAt } = parsed.data

  const result = await db.habit.updateMany({
    where: { id: req.params.id, updatedAt: new Date(expectedUpdatedAt) },
    data: patch,
  })

  if (result.count === 0) {
    const current = await db.habit.findUnique({ where: { id: req.params.id } })
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

habitsRouter.delete("/:id", async (req, res, next) => {
  try {
    await db.habit.delete({ where: { id: req.params.id } })
  } catch (err) {
    if (isPrismaNotFound(err)) {
      res.status(404).json({ error: "Habit not found" })
      return
    }
    next(err)
    return
  }
  res.status(204).end()
})
