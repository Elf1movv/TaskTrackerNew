import type { Reminder } from "../model/reminder"

// Reminders due on one specific day, sorted by time (no-time reminders
// first) — used by the calendar grid cell and the day detail panel.
export function selectRemindersOnDay(reminders: Reminder[], dayKey: string): Reminder[] {
  return reminders.filter(r => r.date === dayKey).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
}
