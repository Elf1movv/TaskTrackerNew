import { z } from "zod"
import { dateField, timeField } from "./dateTime.js"

// Wire format is "YYYY-MM-DD" / "HH:mm" — the shared checks in dateTime.ts.
// The date is required here (not nullable): a reminder is always pinned to a
// day, only its time is optional.
const reminderFields = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  date: dateField,
  time: timeField.nullable(),
  priority: z.enum(["normal", "critical"]),
  completed: z.boolean(),
})

export const createReminderSchema = reminderFields

export const updateReminderSchema = z.object({
  patch: reminderFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string(),
})
