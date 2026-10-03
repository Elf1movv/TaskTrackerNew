import { Router } from "express"
import type { Prisma } from "@prisma/client"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createGoalSchema, reorderSchema, updateGoalSchema } from "../validation/goal.js"

import { ownerTransaction } from "../lib/productLogic.js"

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
  targetDate: string | null
  color: string
  milestones: ClientMilestone[]
  achievedAt: Date | null
  updatedAt: Date
}

async function toClientGoal(goal: {
  id: string
  title: string
  description: string
  progress: number
  targetDate: string | null
  color: string
  milestones: unknown
  achievedAt: Date | null
  updatedAt: Date
}): Promise<ClientGoal> {
  const linked = await db.task.findMany({
    where: { goalId: goal.id, retiredAt: null, legacyPending: false },
    select: { completed: true },
  })
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    progress: linked.length
      ? Math.round((linked.filter(task => task.completed).length / linked.length) * 100)
      : 0,
    achievedAt: goal.achievedAt,
    targetDate: goal.targetDate,
    color: goal.color,
    milestones: goal.milestones as ClientMilestone[],
    updatedAt: goal.updatedAt,
  }
}

goalsRouter.get("/", async (req, res) => {
  const goals = await db.goal.findMany({ where: { userId: req.userId }, orderBy: { order: "asc" } })
  res.json(await Promise.all(goals.map(toClientGoal)))
})

goalsRouter.post("/", async (req, res) => {
  const parsed = createGoalSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid goal", details: parsed.error.flatten() })
    return
  }

  // New goals are appended on the client (added goals show up last), so
  // they need an order larger than everything currently stored.
  const { _max } = await db.goal.aggregate({ where: { userId: req.userId }, _max: { order: true } })
  const created = await db.goal.create({
    data: {
      ...parsed.data,
      userId: req.userId,
      milestones: parsed.data.milestones as unknown as Prisma.InputJsonValue,
      order: (_max.order ?? -1) + 1,
    },
  })
  res.status(201).json(await toClientGoal(created))
})

goalsRouter.patch("/reorder", async (req, res) => {
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
      .map(({ id, order }) => db.goal.updateMany({ where: { id, userId: req.userId }, data: { order } })),
  )
  // Prisma's @updatedAt bumps updatedAt on every reordered row even though
  // only `order` changed — the client must learn the new values, or its
  // next per-item PATCH on any of these goals will carry a stale
  // expectedUpdatedAt and get a false 409 "changed elsewhere".
  const updated = await db.goal.findMany({
    where: { id: { in: parsed.data.map(d => d.id) }, userId: req.userId },
    select: { id: true, updatedAt: true },
  })
  res.json(updated)
})

goalsRouter.patch("/:id", async (req, res) => {
  const parsed = updateGoalSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid goal patch", details: parsed.error.flatten() })
    return
  }
  const { patch, expectedUpdatedAt } = parsed.data

  const result = await ownerTransaction(req.userId, tx =>
    tx.goal.updateMany({
      where: { id: req.params.id, userId: req.userId, updatedAt: new Date(expectedUpdatedAt) },
      data: {
        ...patch,
        milestones:
          patch.milestones !== undefined ? (patch.milestones as unknown as Prisma.InputJsonValue) : undefined,
      },
    }),
  )

  if (result.count === 0) {
    const current = await db.goal.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!current) {
      res.status(404).json({ error: "Goal not found" })
      return
    }
    res.status(409).json({ error: "Goal was changed elsewhere", current: await toClientGoal(current) })
    return
  }

  const updated = await db.goal.findUniqueOrThrow({ where: { id: req.params.id } })
  res.json(await toClientGoal(updated))
})

goalsRouter.delete("/:id", async (req, res) => {
  const result = await ownerTransaction(req.userId, async tx => {
    const goal = await tx.goal.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!goal) return { count: 0 }
    await tx.task.updateMany({ where: { goalId: goal.id, userId: req.userId }, data: { goalId: null } })
    return tx.goal.deleteMany({ where: { id: goal.id, userId: req.userId } })
  })
  if (result.count === 0) {
    res.status(404).json({ error: "Goal not found" })
    return
  }
  res.status(204).end()
})
