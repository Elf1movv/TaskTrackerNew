export type Priority = "low" | "medium" | "high"

export interface Task {
  id: string
  title: string
  completed: boolean
  priority: Priority
  category: string
  dueDate: string | null
  // "HH:mm", 24h — only meaningful when dueDate is set (see TaskForm,
  // which clears it whenever the due-date toggle turns off). Same
  // convention as Reminder.time.
  time: string | null
  // "HH:mm", 24h — optional end of the task's timed block on the Day/Week
  // calendar timeline. Only meaningful when both dueDate and time are
  // set. Nullable: existing/older tasks render at a fixed fallback block
  // height in the timeline until edited (see HourGrid).
  endTime: string | null
  completedAt: string | null
  // Optional free-text notes, same nullable-additive convention as endTime
  // — existing tasks have no value until edited.
  description: string | null
  updatedAt: string
  createdAt: string
}

// Semantic tokens (theme.css), not fixed hex — same 3 colors the redesign
// uses everywhere else for low/medium/high meaning (success/warning/
// destructive), and they adapt correctly in dark mode this way.
export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "var(--success)",
  medium: "var(--warning)",
  high: "var(--destructive)",
}

export type StatusFilter = "all" | "active" | "done"
