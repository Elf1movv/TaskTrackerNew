import type { Habit } from "../model/habit"

// Habits scheduled on an arbitrary day (by weekday, not a specific date —
// a Habit has no per-instance date of its own, see schema.prisma). Used by
// the calendar (any day) and generalized from what selectTodayHabits used
// to compute inline just for "today".
export function selectHabitsOnDay(habits: Habit[], day: Date): Habit[] {
  return habits.filter(habit => habit.activeDays.includes(day.getDay()))
}
