import { z } from "zod"
import { dateField, instantField } from "./dateTime.js"

const taskFields = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  completed: z.boolean(),
  priority: z.enum(["low", "medium", "high"]),
  category: z.string(),
  // Wire format stays "YYYY-MM-DD" even though the DB column is a real
  // `date` — the shared check converts it to the Date Prisma expects.
  dueDate: dateField.nullable(),
  description: z.string().nullable(),
  // Set by the client to the current instant when `completed` flips to true,
  // and to `null` when it flips back to false — see the comment on
  // Task.completedAt in schema.prisma for why this can't be derived from
  // `updatedAt` instead.
  completedAt: instantField.nullable(),
})

export const createTaskSchema = taskFields

export const updateTaskSchema = z.object({
  patch: taskFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string(),
})

export const reorderSchema = z.array(z.object({ id: z.string().uuid(), order: z.number().int() }))
