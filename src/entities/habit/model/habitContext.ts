import { createContext, useContext } from "react"
import type { Habit } from "./habit"

export interface HabitContextValue {
  habits: Habit[]
  // Returns the new habit's id (generated on the client) — the onboarding
  // uses it to find and highlight the habit it just created.
  addHabit: (habit: Omit<Habit, "id" | "updatedAt" | "createdAt" | "completedDates">) => string
  updateHabit: (id: string, patch: Partial<Omit<Habit, "id" | "updatedAt">>) => void
  deleteHabit: (id: string) => Promise<void>
  // Reorders within one group (writes `order`). One habit order for Today
  // and Habits since audit batch 4 (decision 4, 2026-11-09).
  reorderHabitsInGroup: (groupId: string, draggedId: string, targetId: string) => void
  // Cross-group drag-and-drop (Today and Habits): moves a habit into a different
  // group and appends it at the end of that group's list (writes `order`).
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
