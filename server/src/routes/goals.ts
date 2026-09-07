import { Router } from "express"
import type { Prisma } from "@prisma/client"
import { db } from "../db.js"

export const goalsRouter = Router()

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
}

// Same shape-narrowing purpose as tasksRouter's toClientTask — DB-only
// fields (order, createdAt, updatedAt, userId) never leave the server.
function toClientGoal(goal: {
  id: string
  title: string
  description: string
  progress: number
  targetDate: string
  color: string
  milestones: unknown
}): ClientGoal {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    progress: goal.progress,
    targetDate: goal.targetDate,
    color: goal.color,
    milestones: goal.milestones as ClientMilestone[],
  }
}

goalsRouter.get("/", async (_req, res) => {
  const goals = await db.goal.findMany({ orderBy: { order: "asc" } })
  res.json(goals.map(toClientGoal))
})

// Whole-collection replace, same contract as tasksRouter.put — see its
// comment for why. `milestones` is stored as-is (JSON column), no
// reshaping needed since the frontend's shape already matches the schema.
goalsRouter.put("/", async (req, res) => {
  const goals = req.body as ClientGoal[]

  if (!Array.isArray(goals)) {
    res.status(400).json({ error: "Expected an array of goals" })
    return
  }

  await db.$transaction([
    db.goal.deleteMany({}),
    db.goal.createMany({
      data: goals.map((goal, index) => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        progress: goal.progress,
        targetDate: goal.targetDate,
        color: goal.color,
        milestones: goal.milestones as unknown as Prisma.InputJsonValue,
        order: index,
      })),
    }),
  ])

  res.json(goals)
})
