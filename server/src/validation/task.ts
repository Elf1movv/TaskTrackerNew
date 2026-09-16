import { z } from "zod"

const taskFields = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  completed: z.boolean(),
  priority: z.enum(["low", "medium", "high"]),
  category: z.string().min(1),
  dueDate: z.string().nullable(),
})

export const createTaskSchema = taskFields

export const updateTaskSchema = z.object({
  patch: taskFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string(),
})

export const reorderSchema = z.array(z.object({ id: z.string().uuid(), order: z.number().int() }))
