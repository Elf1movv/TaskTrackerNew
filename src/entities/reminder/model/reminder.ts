export type ReminderPriority = "normal" | "critical"

// "critical" reuses the same red Task's "high" priority already uses
// elsewhere in the app — one consistent meaning for that color.
export const REMINDER_PRIORITY_COLORS: Record<ReminderPriority, string> = {
  normal: "#8a8578",
  critical: "#c9503a",
}

export interface Reminder {
  id: string
  title: string
  date: string
  time: string | null
  priority: ReminderPriority
  completed: boolean
  updatedAt: string
}
