import { Router } from "express"
import { db } from "../db.js"

export const habitsRouter = Router()

interface ClientHabit {
  id: string
  title: string
  icon: string
  color: string
  completedDates: string[]
}

function toClientHabit(habit: {
  id: string
  title: string
  icon: string
  color: string
  completedDates: string[]
}): ClientHabit {
  return {
    id: habit.id,
    title: habit.title,
    icon: habit.icon,
    color: habit.color,
    completedDates: habit.completedDates,
  }
}

habitsRouter.get("/", async (_req, res) => {
  const habits = await db.habit.findMany({ orderBy: { order: "asc" } })
  res.json(habits.map(toClientHabit))
})

// Whole-collection replace, same contract as tasksRouter.put.
habitsRouter.put("/", async (req, res) => {
  const habits = req.body as ClientHabit[]

  if (!Array.isArray(habits)) {
    res.status(400).json({ error: "Expected an array of habits" })
    return
  }

  await db.$transaction([
    db.habit.deleteMany({}),
    db.habit.createMany({
      data: habits.map((habit, index) => ({
        id: habit.id,
        title: habit.title,
        icon: habit.icon,
        color: habit.color,
        completedDates: habit.completedDates,
        order: index,
      })),
    }),
  ])

  res.json(habits)
})
