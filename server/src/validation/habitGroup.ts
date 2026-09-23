import { z } from "zod"

// `isGeneral` is deliberately not accepted from the client — the server
// alone decides that, always `false` for anything created via POST. The
// one `isGeneral: true` row per user is created only by the lazy-seed in
// routes/habitGroups.ts, never by a client-supplied payload.
const habitGroupFields = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  icon: z.string().min(1),
})

export const createHabitGroupSchema = habitGroupFields

export const updateHabitGroupSchema = z.object({
  patch: habitGroupFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string(),
})

export const reorderSchema = z.array(z.object({ id: z.string().uuid(), order: z.number().int() }))
