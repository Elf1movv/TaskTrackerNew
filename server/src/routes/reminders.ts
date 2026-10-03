import { Router } from "express"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createReminderSchema, updateReminderSchema } from "../validation/reminder.js"

import type { Reminder } from "@prisma/client"
import { checkTask, fail, ownerTransaction, refreshPlanReminders } from "../lib/productLogic.js"

export const remindersRouter = Router()

remindersRouter.use(requireAuth)

function toClientReminder({ userId: _user, ...reminder }: Reminder) {
  return { ...reminder, date: reminder.date.toISOString().slice(0, 10) }
}
async function checkLinks(
  tx: import("@prisma/client").Prisma.TransactionClient,
  userId: string,
  data: { taskId?: string | null; planId?: string | null; offsetMinutes?: number | null },
) {
  if (data.taskId && data.planId) fail(400, "Choose one reminder target")
  await checkTask(tx, userId, data.taskId)
  if (data.offsetMinutes != null && !data.planId) fail(400, "Relative reminder needs a plan")
  if (!data.planId) return null
  const plan = await tx.calendarPlan.findFirst({ where: { id: data.planId, userId } })
  if (!plan) fail(404, "Plan not found")
  return plan
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

  const created = await ownerTransaction(req.userId, async tx => {
    const plan = await checkLinks(tx, req.userId, parsed.data)
    const reminder = await tx.reminder.create({ data: { ...parsed.data, userId: req.userId } })
    if (plan) await refreshPlanReminders(tx, plan)
    return tx.reminder.findUniqueOrThrow({ where: { id: reminder.id } })
  })
  res.status(201).json(toClientReminder(created))
})

remindersRouter.patch("/:id", async (req, res) => {
  const parsed = updateReminderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reminder patch", details: parsed.error.flatten() })
    return
  }
  const { patch, expectedUpdatedAt } = parsed.data

  const result = await ownerTransaction(req.userId, async tx => {
    const current = await tx.reminder.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!current) fail(404, "Reminder not found")
    if (current.updatedAt.toISOString() !== expectedUpdatedAt) return { conflict: true, reminder: current }
    const plan = await checkLinks(tx, req.userId, { ...current, ...patch })
    await tx.reminder.update({ where: { id: current.id }, data: { ...patch, suspended: false } })
    if (plan) await refreshPlanReminders(tx, plan)
    return { conflict: false, reminder: await tx.reminder.findUniqueOrThrow({ where: { id: current.id } }) }
  })
  if (result.conflict) {
    res.status(409).json({ error: "Reminder changed elsewhere", current: toClientReminder(result.reminder) })
    return
  }
  res.json(toClientReminder(result.reminder))
})

remindersRouter.delete("/:id", async (req, res) => {
  const result = await db.reminder.deleteMany({ where: { id: req.params.id, userId: req.userId } })
  if (result.count === 0) {
    res.status(404).json({ error: "Reminder not found" })
    return
  }
  res.status(204).end()
})
