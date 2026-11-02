import { Router } from "express"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createReminderSchema, updateReminderSchema } from "../validation/reminder.js"

export const remindersRouter = Router()

remindersRouter.use(requireAuth)

interface ClientReminder {
  id: string
  title: string
  date: string
  time: string | null
  priority: string
  completed: boolean
  updatedAt: Date
}

// `date` is stored as a real SQL `date` (see schema.prisma) but the wire
// format stays "YYYY-MM-DD" — same mapping as toClientTask's dueDate.
function toClientReminder(reminder: {
  id: string
  title: string
  date: Date
  time: string | null
  priority: string
  completed: boolean
  updatedAt: Date
}): ClientReminder {
  return {
    id: reminder.id,
    title: reminder.title,
    date: reminder.date.toISOString().slice(0, 10),
    time: reminder.time,
    priority: reminder.priority,
    completed: reminder.completed,
    updatedAt: reminder.updatedAt,
  }
}

remindersRouter.get("/", async (req, res) => {
  const reminders = await db.reminder.findMany({
    where: { userId: req.userId },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  })
  res.json(reminders.map(toClientReminder))
})

remindersRouter.post("/", async (req, res) => {
  const parsed = createReminderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reminder", details: parsed.error.flatten() })
    return
  }

  const created = await db.reminder.create({ data: { ...parsed.data, userId: req.userId } })
  res.status(201).json(toClientReminder(created))
})

remindersRouter.patch("/:id", async (req, res) => {
  const parsed = updateReminderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reminder patch", details: parsed.error.flatten() })
    return
  }
  const { patch, expectedUpdatedAt } = parsed.data

  const result = await db.reminder.updateMany({
    where: { id: req.params.id, userId: req.userId, updatedAt: new Date(expectedUpdatedAt) },
    data: patch,
  })

  if (result.count === 0) {
    const current = await db.reminder.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!current) {
      res.status(404).json({ error: "Reminder not found" })
      return
    }
    res.status(409).json({ error: "Reminder was changed elsewhere", current: toClientReminder(current) })
    return
  }

  const updated = await db.reminder.findUniqueOrThrow({ where: { id: req.params.id } })
  res.json(toClientReminder(updated))
})

remindersRouter.delete("/:id", async (req, res) => {
  const result = await db.reminder.deleteMany({ where: { id: req.params.id, userId: req.userId } })
  if (result.count === 0) {
    res.status(404).json({ error: "Reminder not found" })
    return
  }
  res.status(204).end()
})
