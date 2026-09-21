import type { Habit } from "../model/habit"

// Only habits scheduled for today's day of week — an unscheduled habit
// still exists (manage it from the Habits page), it just doesn't clutter
// Today. Mirrors entities/task/lib/selectTodayTasks.ts.
export function selectTodayHabits(habits: Habit[]): Habit[] {
  const today = new Date().getDay()
  return habits.filter(habit => habit.activeDays.includes(today))
}
