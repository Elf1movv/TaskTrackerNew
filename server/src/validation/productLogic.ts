import { z } from "zod"
import { dateField, instantField, timeField } from "./dateTime.js"
export const noteFields = z.object({
  id: z.string().uuid(),
  completed: z.boolean().optional(),
  title: z.string().trim().min(1).max(500),
  description: z.string().max(50000).nullable(),
  archivedAt: instantField.nullable(),
})
export const planFields = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(500),
  description: z.string().max(50000).nullable(),
  date: dateField.nullable(),
  time: timeField.nullable(),
  endTime: timeField.nullable(),
  durationMinutes: z.number().int().min(1).max(1439),
  onHold: z.boolean(),
  completed: z.boolean(),
  priority: z.enum(["low", "medium", "high"]),
  category: z.string().max(500),
})
export function validPlan(plan: Pick<z.infer<typeof planFields>, "onHold" | "date" | "time" | "endTime">) {
  return plan.onHold
    ? !plan.date && !plan.time && !plan.endTime
    : !!plan.date &&
        (!plan.endTime || (!!plan.time && plan.endTime > plan.time)) &&
        (!!plan.time || !plan.endTime)
}
export const patchNote = z.object({
  patch: noteFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string().datetime(),
})
export const patchPlan = z.object({
  patch: planFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string().datetime(),
})
