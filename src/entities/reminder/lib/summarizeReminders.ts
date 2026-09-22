import { selectUpcomingReminders } from "./selectUpcomingReminders"
import type { Reminder } from "../model/reminder"

export interface ReminderSummaryCounts {
  total: number
  critical: number
}

// Counts of not-yet-done, upcoming reminders — the basis for the badge
// shown on both bell icons (Today's swap card and the global one) and
// their hover tooltip breakdown.
export function summarizeReminders(reminders: Reminder[]): ReminderSummaryCounts {
  const upcoming = selectUpcomingReminders(reminders).filter(r => !r.completed)
  return {
    total: upcoming.length,
    critical: upcoming.filter(r => r.priority === "critical").length,
  }
}
