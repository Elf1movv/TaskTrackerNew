import { z } from "zod"
export const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(s => {
    const date = new Date(s)
    return !isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === s
  }, "Invalid date")
  .transform(s => new Date(s))
export const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
export const instantField = z
  .string()
  .datetime()
  .transform(s => new Date(s))
export const noteFields = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(500),
  description: z.string().max(50000).nullable(),
  showFrom: dateField.nullable(),
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
  taskId: z.string().uuid().nullable(),
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
