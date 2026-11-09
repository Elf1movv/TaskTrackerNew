import { z } from "zod"
import { dayString } from "./dateTime.js"

const habitFields = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
  // Days the habit was done, "YYYY-MM-DD" each (shared check, dateTime.ts).
  completedDates: z.array(dayString),
  activeDays: z.array(z.number().int().min(0).max(6)),
  groupId: z.string().uuid(),
})

export const createHabitSchema = habitFields

export const updateHabitSchema = z.object({
  patch: habitFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string(),
})

export const reorderSchema = z.array(z.object({ id: z.string().uuid(), order: z.number().int() }))
