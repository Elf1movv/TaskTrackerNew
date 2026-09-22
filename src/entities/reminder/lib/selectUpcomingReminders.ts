import { getTodayKey } from "@/shared/lib/date"
import type { Reminder } from "../model/reminder"

// Reminders from today onward, soonest first — used by the Today page's
// reminder summary card, capped by the caller (not here — this just orders
// and filters, same "selector, not a UI concern" split as selectTodayTasks).
export function selectUpcomingReminders(reminders: Reminder[]): Reminder[] {
  const today = getTodayKey()
  return reminders
    .filter(r => r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""))
}
