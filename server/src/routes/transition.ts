import { Router } from "express"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { fail, ownerTransaction } from "../lib/productLogic.js"
import { toClientTask } from "./tasks.js"

export const transitionRouter = Router()
transitionRouter.use(requireAuth)
transitionRouter.get("/", async (req, res) => {
  const tasks = await db.task.findMany({
    where: { userId: req.userId, legacyPending: true, retiredAt: null },
    orderBy: { order: "asc" },
  })
  res.json({ tasks: tasks.map(toClientTask) })
})
const choiceSchema = z.object({
  sourceId: z.string().uuid(),
  choice: z.enum(["task", "note", "plan"]),
  expectedUpdatedAt: z.string().datetime(),
})
transitionRouter.post("/task", async (req, res) => {
  const parsed = choiceSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid transition" })
    return
  }
  const result = await ownerTransaction(req.userId, async tx => {
    const { sourceId, choice, expectedUpdatedAt } = parsed.data
    const sourceKey = `task:${sourceId}`
    const previous = await tx.legacyTransition.findUnique({
      where: { userId_sourceKey: { userId: req.userId, sourceKey } },
    })
    if (previous) {
      if (previous.choice !== choice) fail(409, "Already classified differently")
      return { resultId: previous.resultId, choice }
    }
    const task = await tx.task.findFirst({
      where: { id: sourceId, userId: req.userId, legacyPending: true, retiredAt: null },
    })
    if (!task) fail(404, "Legacy task not found")
    if (task.updatedAt.toISOString() !== expectedUpdatedAt) fail(409, "Source changed; review again")
    let resultId = task.id
    if (choice === "note") {
      const { _max } = await tx.note.aggregate({ where: { userId: req.userId }, _max: { order: true } })
      const note = await tx.note.create({
        data: {
          userId: req.userId,
          title: task.title,
          description: task.description,
          showFrom: task.dueDate,
          archivedAt: null,
          completed: task.completed,
          order: (_max.order ?? -1) + 1,
        },
      })
      resultId = note.id
    } else if (choice === "plan") {
      // Legacy forms could store incomplete/out-of-range times. Preserve
      // their exact original in the snapshot, and normalize the new plan.
      const time = task.time && /^([01]\d|2[0-3]):[0-5]\d$/.test(task.time) && task.dueDate ? task.time : null
      const endTime =
        time && task.endTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(task.endTime) && task.endTime > time
          ? task.endTime
          : null
      const minutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3))
      const plan = await tx.calendarPlan.create({
        data: {
          userId: req.userId,
          title: task.title,
          description: task.description,
          date: task.dueDate,
          time,
          endTime,
          durationMinutes: time && endTime ? minutes(endTime) - minutes(time) : 60,
          onHold: !task.dueDate,
          completed: task.completed,
          priority: task.priority,
          category: task.category,
        },
      })
      if (choice === "plan") resultId = plan.id
    }
    await tx.legacyTransition.create({
      data: {
        userId: req.userId,
        sourceKey,
        choice,
        resultId,
        snapshot: JSON.parse(JSON.stringify(task)) as Prisma.InputJsonValue,
      },
    })
    await tx.task.update({
      where: { id: task.id },
      data: {
        legacyPending: false,
        retiredAt: choice === "task" ? null : new Date(),
        time: choice === "task" ? null : task.time,
        endTime: choice === "task" ? null : task.endTime,
      },
    })
    return { resultId, choice }
  })
  res.json(result)
})
