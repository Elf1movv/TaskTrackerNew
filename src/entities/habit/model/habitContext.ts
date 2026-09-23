import { createContext, useContext } from "react"
import type { Habit } from "./habit"

export interface HabitContextValue {
  habits: Habit[]
  addHabit: (habit: Omit<Habit, "id" | "updatedAt" | "createdAt" | "completedDates">) => void
  updateHabit: (id: string, patch: Partial<Omit<Habit, "id" | "updatedAt">>) => void
  deleteHabit: (id: string) => void
  reorderHabits: (draggedId: string, targetId: string) => void
  // Reorders only within one group — used by the Habits page, where each
  // block is its own independent drag list. Unlike reorderHabits above
  // (still used by Today's flat HabitTrackerGrid), this only touches the
  // order of habits already in `groupId`.
  reorderHabitsInGroup: (groupId: string, draggedId: string, targetId: string) => void
  // Cross-group drag-and-drop: moves a habit into a different group and
  // appends it at the end of that group's list.
  moveHabitToGroup: (habitId: string, targetGroupId: string) => void
  toggleHabit: (id: string, date: string) => void
  // Re-fetches every habit from the server — for when a habit group is
  // deleted: the backend reassigns its habits to General in the same
  // transaction, but this collection's local state doesn't know that
  // happened on its own (same pattern as useTasks().refreshTasks after a
  // category delete cascades).
  refreshHabits: () => Promise<void>
}

export const HabitContext = createContext<HabitContextValue | null>(null)

export function useHabits(): HabitContextValue {
  const ctx = useContext(HabitContext)
  if (!ctx) throw new Error("useHabits must be used within a HabitProvider")
  return ctx
}
