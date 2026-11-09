import { format } from "date-fns"
import type { CalendarPlan } from "../model/plan"

// Plans dated in this month (not on hold) and how many of them are done —
// counted in the Year view's monthly ring next to task deadlines, goals and
// habits (audit П9, 2026-11-09). Before, plans — the calendar's main
// content — weren't counted at all.
export function getPlanMonthCompletionStats(plans: CalendarPlan[], month: Date) {
  const monthKey = format(month, "yyyy-MM")
  const inMonth = plans.filter(p => !p.onHold && p.date?.startsWith(monthKey))
  return { done: inMonth.filter(p => p.completed).length, total: inMonth.length }
}
