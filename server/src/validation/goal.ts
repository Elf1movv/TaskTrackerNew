import { z } from "zod"

const milestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  completed: z.boolean(),
})

const goalFields = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  progress: z.number().int().min(0).max(100),
  targetDate: z.string(),
  color: z.string().min(1),
  milestones: z.array(milestoneSchema),
})

export const createGoalSchema = goalFields

export const updateGoalSchema = z.object({
  patch: goalFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string(),
})

export const reorderSchema = z.array(z.object({ id: z.string().uuid(), order: z.number().int() }))
