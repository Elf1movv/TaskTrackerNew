import { parse } from "date-fns"
import { type Reminder } from "@/entities/reminder"
import { formatDateKey } from "@/shared/lib/date"

export type CriticalThreshold = "24h" | "1h" | "day"

const THRESHOLD_MS: Record<"24h" | "1h", number> = {
  "24h": 24 * 60 * 60 * 1000,
  "1h": 60 * 60 * 1000,
}

export interface CriticalAlert {
  reminder: Reminder
  threshold: CriticalThreshold
}

// Pure decision function — given the critical, not-yet-completed reminders,
// which thresholds have newly been crossed as of `now`, excluding ones
// already recorded in `shown` (reminderId -> thresholds already alerted).
// A timed reminder can cross "24h" and "1h" separately (each fires once,
// the moment `now` first lands inside that threshold's window before the
// target time); an untimed one only ever has "day" (fires once, on the
// day it's due) — mirrors the existing due-date-reminders toast, which has
// no time-of-day awareness at all.
export function checkCriticalThresholds(
  criticalReminders: Reminder[],
  shown: Record<string, CriticalThreshold[]>,
  now: Date,
): CriticalAlert[] {
  const alerts: CriticalAlert[] = []

  for (const reminder of criticalReminders) {
    const shownForReminder = shown[reminder.id] ?? []

    if (reminder.time) {
      const target = parse(`${reminder.date} ${reminder.time}`, "yyyy-MM-dd HH:mm", now)
      if (Number.isNaN(target.getTime()) || now >= target) continue

      for (const threshold of ["24h", "1h"] as const) {
        if (shownForReminder.includes(threshold)) continue
        const windowStart = new Date(target.getTime() - THRESHOLD_MS[threshold])
        if (now >= windowStart) alerts.push({ reminder, threshold })
      }
    } else if (!shownForReminder.includes("day") && reminder.date === formatDateKey(now)) {
      alerts.push({ reminder, threshold: "day" })
    }
  }

  return alerts
}
