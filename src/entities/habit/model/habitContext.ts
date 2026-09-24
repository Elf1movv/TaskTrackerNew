import { createContext, useContext } from "react"
import type { Habit } from "./habit"

export interface HabitContextValue {
  habits: Habit[]
  // todayOrder, like id/updatedAt/createdAt/completedDates, is assigned
  // automatically (a placeholder here, the server's real value once
  // create() resolves) — never supplied by the caller.
  addHabit: (habit: Omit<Habit, "id" | "updatedAt" | "createdAt" | "completedDates" | "todayOrder">) => void
  // todayOrder is excluded here too — it only ever changes via
  // reorderHabitsToday/moveHabitToGroupToday below, never a generic patch.
  updateHabit: (id: string, patch: Partial<Omit<Habit, "id" | "updatedAt" | "todayOrder">>) => void
  deleteHabit: (id: string) => void
  // Reorders within one group on the /habits page (writes `order`).
  reorderHabitsInGroup: (groupId: string, draggedId: string, targetId: string) => void
  // Cross-group drag-and-drop on /habits: moves a habit into a different
  // group and appends it at the end of that group's list (writes `order`).
  moveHabitToGroup: (habitId: string, targetGroupId: string) => void
  // Today-page equivalents of the two above — same group membership
  // (groupId is shared), but reorder against `todayOrder` instead of
  // `order`, so dragging on Today never moves anything on /habits.
  reorderHabitsToday: (groupId: string, draggedId: string, targetId: string) => void
  moveHabitToGroupToday: (habitId: string, targetGroupId: string) => void
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
