import { formatDateKey } from "@/shared/lib/date"
import type { Habit } from "../model/habit"

// Only counts habits actually scheduled that weekday (activeDays) — a
// habit not scheduled that day can't be "completed" that day even if a
// stale/duplicate entry exists in completedDates. Used for the sidebar's
// weekly activity chart, same scheduling rule as selectHabitsOnDay/
// getDayCellState.
export function getHabitCompletionsByDay(habits: Habit[], days: Date[]): number[] {
  return days.map(day => {
    const dayKey = formatDateKey(day)
    return habits.filter(
      habit => habit.activeDays.includes(day.getDay()) && habit.completedDates.includes(dayKey),
    ).length
  })
}
