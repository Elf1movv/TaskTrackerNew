import type { CalendarPlan } from "@/entities/calendar-plan"

// Today's schedule for the Today page strip: plans dated today that aren't
// parked in "On hold", timed ones by start time, untimed ones last (they
// have a day but no hour, so they can't be placed between timed ones).
export function selectTodayPlans<T extends Pick<CalendarPlan, "date" | "onHold" | "time">>(
  plans: T[],
  todayKey: string,
): T[] {
  return plans
    .filter(plan => plan.date === todayKey && !plan.onHold)
    .sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time)
      if (a.time) return -1
      if (b.time) return 1
      return 0
    })
}
