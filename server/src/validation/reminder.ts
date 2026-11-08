import { z } from "zod"

// Wire format is "YYYY-MM-DD" — same conversion the client always used for
// Task.dueDate, see validation/task.ts. Required here (not nullable) — a
// reminder is always pinned to a day, only its time is optional.
const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
  .transform(s => new Date(s))

const reminderFields = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  date: dateField,
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "time must be in HH:mm format")
    .nullable(),
  priority: z.enum(["normal", "critical"]),
  completed: z.boolean(),
})

export const createReminderSchema = reminderFields

export const updateReminderSchema = z.object({
  patch: reminderFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string(),
})
