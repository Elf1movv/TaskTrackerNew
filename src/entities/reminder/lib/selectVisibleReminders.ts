import { formatDateKey, getTodayKey } from "@/shared/lib/date"
import type { Reminder } from "../model/reminder"
import { selectUpcomingReminders } from "./selectUpcomingReminders"

// The one rule for the reminder lists on Today and in the bell (audit П4,
// decision 7, 2026-11-09): reminders from today on, soonest first; a checked
// one stays (struck through) until the end of the day it was checked, then
// it's gone — the same rule tasks follow.
//
// A reminder has no "checked at" field of its own, so `updatedAt` stands in
// for it. Side effect: editing an already-checked reminder shows it again
// until the end of that day — acceptable, and it avoids a migration.
export function selectVisibleReminders(reminders: Reminder[]): Reminder[] {
  const today = getTodayKey()
  return selectUpcomingReminders(reminders).filter(
    r => !r.completed || formatDateKey(new Date(r.updatedAt)) === today,
  )
}
