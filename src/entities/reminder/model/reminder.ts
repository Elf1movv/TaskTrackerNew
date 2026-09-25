export type ReminderPriority = "normal" | "critical"

// "critical" reuses the same red Task's "high" priority already uses
// elsewhere in the app — one consistent meaning for that color.
export const REMINDER_PRIORITY_COLORS: Record<ReminderPriority, string> = {
  normal: "#8a8578",
  critical: "#c9503a",
}

// The calendar's reminder blocks (Day/Week/Month) need a border that's
// actually eye-catching against a task block's own pastel category fill —
// REMINDER_PRIORITY_COLORS.normal's muted gray-tan doesn't stand out
// there, so this is a separate constant rather than repurposing that one
// in place (which would also change ReminderPriorityIcon's default
// coloring everywhere else it's used). "critical" reuses the same red as
// above for one consistent meaning; "normal" reuses the warm yellow
// already in PALETTE_COLORS (shared/lib/colors.ts) rather than a new hex.
export const REMINDER_BORDER_COLORS: Record<ReminderPriority, string> = {
  normal: "#c9a63a",
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
