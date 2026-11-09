import { CATEGORY_FALLBACK_COLOR } from "@/shared/lib/colors"

// Plans have no category or priority of their own in the form, so they're
// all drawn in one neutral color (audit Л3, 2026-11-09). Before, old plans
// carried over from tasks kept their category color and priority dot for
// no visible reason. The fallback gray is what every new plan already used.
export const PLAN_COLOR = CATEGORY_FALLBACK_COLOR

export interface CalendarPlan {
  id: string
  title: string
  description: string | null
  date: string | null
  time: string | null
  endTime: string | null
  durationMinutes: number
  onHold: boolean
  completed: boolean
  priority: "low" | "medium" | "high"
  category: string
  createdAt: string
  updatedAt: string
}
// Display adapter for existing timeline geometry. dueDate here is the
// interval's day, not a task deadline, and is never written to Task.
export interface CalendarEntry extends CalendarPlan {
  dueDate: string | null
  completedAt: string | null
}
