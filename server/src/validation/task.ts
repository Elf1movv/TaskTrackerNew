import { z } from "zod"

// Wire format stays "YYYY-MM-DD" (what the client has always sent/received)
// even though the DB column is a real `date` now — this is the one place
// that converts the incoming string to the Date Prisma expects.
const dueDateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be in YYYY-MM-DD format")
  .transform(s => new Date(s))
  .nullable()

// Set by the client to the current instant when `completed` flips to true,
// and to `null` when it flips back to false — see the comment on
// Task.completedAt in schema.prisma for why this can't be derived from
// `updatedAt` instead.
const completedAtField = z
  .string()
  .datetime()
  .transform(s => new Date(s))
  .nullable()

const taskFields = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  completed: z.boolean(),
  priority: z.enum(["low", "medium", "high"]),
  category: z.string().min(1),
  dueDate: dueDateField,
  completedAt: completedAtField,
})

export const createTaskSchema = taskFields

export const updateTaskSchema = z.object({
  patch: taskFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string(),
})

export const reorderSchema = z.array(z.object({ id: z.string().uuid(), order: z.number().int() }))
