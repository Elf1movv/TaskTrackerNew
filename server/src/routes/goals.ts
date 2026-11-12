import { Router } from "express"
import type { Prisma } from "@prisma/client"
import { db } from "../db.js"
import { computeGoalProgress } from "../lib/goalProgress.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createGoalSchema, reorderSchema, updateGoalSchema } from "../validation/goal.js"

export const goalsRouter = Router()

goalsRouter.use(requireAuth)

interface ClientMilestone {
  id: string
  title: string
  completed: boolean
}

interface ClientSubgoal {
  id: string
  title: string
  milestones: ClientMilestone[]
}

interface ClientGoal {
  id: string
  title: string
  description: string
  progress: number
  targetDate: string | null
  color: string
  category: string | null
  milestones: ClientMilestone[]
  subgoals: ClientSubgoal[]
  updatedAt: Date
}

function toClientGoal(goal: {
  id: string
  title: string
  description: string
  progress: number
  targetDate: string | null
  color: string
  category: string | null
  milestones: unknown
  subgoals: unknown
  updatedAt: Date
}): ClientGoal {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    progress: goal.progress,
    targetDate: goal.targetDate,
    color: goal.color,
    category: goal.category,
    milestones: goal.milestones as ClientMilestone[],
    subgoals: (goal.subgoals ?? []) as ClientSubgoal[],
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

  // A new goal goes first (owner decision 2026-11-12): the client puts it at
  // the top, so it needs an order smaller than everything currently stored —
  // that also makes it show on Today's first-5 goal card right away.
  const { _min } = await db.goal.aggregate({ where: { userId: req.userId }, _min: { order: true } })
  const subgoals = parsed.data.subgoals ?? []
  const created = await db.goal.create({
    data: {
      ...parsed.data,
      userId: req.userId,
      milestones: parsed.data.milestones as unknown as Prisma.InputJsonValue,
      subgoals: subgoals as unknown as Prisma.InputJsonValue,
      progress: computeGoalProgress(parsed.data.milestones, subgoals),
      order: (_min.order ?? 1) - 1,
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

  // Progress is derived, never trusted from the client: whenever steps or
  // subgoals change, recompute it from the new value plus the stored other
  // half. The version check below still guards against a concurrent write.
  let progress = patch.progress
  if (patch.milestones !== undefined || patch.subgoals !== undefined || patch.progress !== undefined) {
    const stored = await db.goal.findFirst({
      where: { id: req.params.id, userId: req.userId },
      select: { milestones: true, subgoals: true },
    })
    if (stored) {
      progress = computeGoalProgress(
        patch.milestones ?? (stored.milestones as unknown as ClientMilestone[]),
        patch.subgoals ?? (stored.subgoals as unknown as ClientSubgoal[]),
      )
    }
  }

  const result = await db.goal.updateMany({
    where: { id: req.params.id, userId: req.userId, updatedAt: new Date(expectedUpdatedAt) },
    data: {
      ...patch,
      progress,
      milestones:
        patch.milestones !== undefined ? (patch.milestones as unknown as Prisma.InputJsonValue) : undefined,
      subgoals:
        patch.subgoals !== undefined ? (patch.subgoals as unknown as Prisma.InputJsonValue) : undefined,
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
