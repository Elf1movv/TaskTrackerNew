import { formatDateKey, getTodayKey } from "@/shared/lib/date"
import type { Reminder } from "../model/reminder"
import { selectUpcomingReminders } from "./selectUpcomingReminders"

// The one rule for the reminder lists on Today and in the bell (audit П4,
// decision 7, 2026-11-09): reminders from today on, soonest first; a checked
// one stays (struck through) until the end of the day it was checked, then
// it's gone — the same rule tasks follow.
//
// The day it was checked is `completedAt` (audit batch 4), so editing a
// checked reminder later doesn't bring it back.
export function selectVisibleReminders(reminders: Reminder[]): Reminder[] {
  const today = getTodayKey()
  return selectUpcomingReminders(reminders).filter(
    r => !r.completed || (!!r.completedAt && formatDateKey(new Date(r.completedAt)) === today),
  )
}
