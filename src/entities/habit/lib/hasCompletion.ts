import type { Habit } from "../model/habit"

// "Is this day marked?" for the habit calculations (speed iteration
// 2026-11-18). `completedDates.includes` walks the whole list on every call —
// the Year view asks hundreds of thousands of times. A Set answers at once.
// One Set per list, kept in a WeakMap: every mark replaces the list with a new
// array (never edited in place), so a new list gets a new Set and an old one
// is forgotten together with its list.
const sets = new WeakMap<string[], Set<string>>()

export function hasCompletion(habit: Pick<Habit, "completedDates">, dateKey: string): boolean {
  let set = sets.get(habit.completedDates)
  if (!set) {
    set = new Set(habit.completedDates)
    sets.set(habit.completedDates, set)
  }
  return set.has(dateKey)
}
