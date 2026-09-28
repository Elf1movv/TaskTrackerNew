import { selectHabitsOnDay } from "./selectHabitsOnDay"
import type { Habit } from "../model/habit"

// Only habits scheduled for today's day of week — an unscheduled habit
// still exists (manage it from the Habits page), it just doesn't clutter
// Today. Mirrors entities/task/lib/selectTodayTasks.ts.
//
// Sorted by todayOrder — GET /api/habits (server/src/routes/habits.ts)
// always sorts its response by `order` (the /habits page's own axis),
// since a single request can only pre-sort one way; `todayOrder` (Today's
// independent axis, see HabitProvider.tsx's reorderHabitsToday) comes back
// as just a field on each habit, not reflected in array order. Without
// this sort, a fresh fetch (e.g. a page reload right after dragging a
// habit on Today) silently reverted to the `order`-based sequence even
// though todayOrder was correctly saved — direct feedback, 2026-09-28.
export function selectTodayHabits(habits: Habit[]): Habit[] {
  return selectHabitsOnDay(habits, new Date()).sort((a, b) => a.todayOrder - b.todayOrder)
}
