import { Router } from "express"
import type { Prisma } from "@prisma/client"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createGoalSchema, reorderSchema, updateGoalSchema } from "../validation/goal.js"

export const goalsRouter = Router()

goalsRouter.use(requireAuth)

interface ClientMilestone {
  id: string
  title: string
  completed: boolean
}

interface ClientGoal {
  id: string
  title: string
  description: string
  progress: number
  targetDate: string
  color: string
  milestones: ClientMilestone[]
  updatedAt: Date
}

function toClientGoal(goal: {
  id: string
  title: string
  description: string
  progress: number
  targetDate: string
  color: string
  milestones: unknown
  updatedAt: Date
}): ClientGoal {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    progress: goal.progress,
    targetDate: goal.targetDate,
    color: goal.color,
    milestones: goal.milestones as ClientMilestone[],
    updatedAt: goal.updatedAt,
  }
}

goalsRouter.get("/", async (req, res) => {
  const goals = await db.goal.findMany({ where: { userId: req.userId }, orderBy: { order: "asc" } })
  res.json(goals.map(toClientGoal))
})

goalsRouter.post("/", async (req, res) => {
  const parsed = createGoalSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid goal", details: parsed.error.flatten() })
    return
  }

  const { _min } = await db.goal.aggregate({ where: { userId: req.userId }, _min: { order: true } })
  const created = await db.goal.create({
    data: {
      ...parsed.data,
      userId: req.userId,
      milestones: parsed.data.milestones as unknown as Prisma.InputJsonValue,
      order: (_min.order ?? 0) - 1,
    },
  })
  res.status(201).json(toClientGoal(created))
})

goalsRouter.patch("/reorder", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reorder payload", details: parsed.error.flatten() })
    return
  }

  await db.$transaction(
    parsed.data.map(({ id, order }) =>
      db.goal.updateMany({ where: { id, userId: req.userId }, data: { order } }),
    ),
  )
  res.status(204).end()
})

goalsRouter.patch("/:id", async (req, res) => {
  const parsed = updateGoalSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid goal patch", details: parsed.error.flatten() })
    return
  }
  const { patch, expectedUpdatedAt } = parsed.data

  const result = await db.goal.updateMany({
    where: { id: req.params.id, userId: req.userId, updatedAt: new Date(expectedUpdatedAt) },
    data: {
      ...patch,
      milestones:
        patch.milestones !== undefined ? (patch.milestones as unknown as Prisma.InputJsonValue) : undefined,
    },
  })

  if (result.count === 0) {
    const current = await db.goal.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!current) {
      res.status(404).json({ error: "Goal not found" })
      return
    }
    res.status(409).json({ error: "Goal was changed elsewhere", current: toClientGoal(current) })
    return
  }

  const updated = await db.goal.findUniqueOrThrow({ where: { id: req.params.id } })
  res.json(toClientGoal(updated))
})

goalsRouter.delete("/:id", async (req, res) => {
  const result = await db.goal.deleteMany({ where: { id: req.params.id, userId: req.userId } })
  if (result.count === 0) {
    res.status(404).json({ error: "Goal not found" })
    return
  }
  res.status(204).end()
})
