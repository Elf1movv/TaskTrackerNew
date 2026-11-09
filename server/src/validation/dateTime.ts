import { z } from "zod"

// One place for the wire formats every router accepts (audit Д6, 2026-11-09).
// Before this, tasks and reminders only checked the shape (\d{4}-\d{2}-\d{2},
// \d{2}:\d{2}) and let "2026-02-31" or "99:99" through, while notes and plans
// already checked real values.

// A calendar day, "YYYY-MM-DD", kept as a string — for columns that store the
// day as text (Goal.targetDate, Habit.completedDates). The string must name a
// real date: new Date() would silently roll "2026-02-31" over to March 3, so
// the round trip back to the same string is the check.
export const dayString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
  .refine(s => {
    const date = new Date(s)
    return !isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === s
  }, "date must be a real calendar date")

// The same day, converted to the Date that Prisma expects for `@db.Date` columns.
export const dateField = dayString.transform(s => new Date(s))

// A time of day, "HH:mm", 00:00–23:59. Stored as a plain string.
export const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "time must be HH:mm, 00:00–23:59")

// A moment in time (ISO 8601 with time zone), e.g. completedAt / archivedAt.
export const instantField = z
  .string()
  .datetime()
  .transform(s => new Date(s))
