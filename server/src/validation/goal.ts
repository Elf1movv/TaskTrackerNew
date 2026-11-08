import { z } from "zod"

const milestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  completed: z.boolean(),
  // Position among the goal's top-level items (own steps + subgoals share
  // one order). Optional: goals saved before it simply don't have it. Must
  // be declared — zod strips unknown keys, so it would silently be lost.
  order: z.number().int().optional(),
})

const subgoalSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  milestones: z.array(milestoneSchema),
  order: z.number().int().optional(),
})

const goalFields = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  progress: z.number().int().min(0).max(100),
  targetDate: z.string().nullable(),
  color: z.string().min(1),
  // Optional so older clients that never send it keep working.
  category: z.string().min(1).nullable().optional(),
  milestones: z.array(milestoneSchema),
  // Optional so older clients that never send it keep working (and a PATCH
  // without it leaves the stored subgoals untouched).
  subgoals: z.array(subgoalSchema).optional(),
})

export const createGoalSchema = goalFields

export const updateGoalSchema = z.object({
  patch: goalFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string(),
})

export const reorderSchema = z.array(z.object({ id: z.string().uuid(), order: z.number().int() }))
