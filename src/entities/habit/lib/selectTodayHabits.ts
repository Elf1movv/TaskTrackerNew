import { selectHabitsOnDay } from "./selectHabitsOnDay"
import type { Habit } from "../model/habit"

// Only habits scheduled for today's day of week — an unscheduled habit
// still exists (manage it from the Habits page), it just doesn't clutter
// Today.
//
// In the shared habit order (GET /api/habits sorts by `order`; reorder()
// keeps the array in that order) — one order for Today and Habits since
// audit batch 4 (decision 4, 2026-11-09).
export function selectTodayHabits(habits: Habit[]): Habit[] {
  return selectHabitsOnDay(habits, new Date())
}
