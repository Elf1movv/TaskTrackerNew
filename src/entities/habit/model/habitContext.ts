import { createContext, useContext } from "react"
import type { Habit } from "./habit"

export interface HabitContextValue {
  habits: Habit[]
  addHabit: (habit: Omit<Habit, "id" | "completedDates">) => void
  updateHabit: (id: string, patch: Omit<Habit, "id" | "completedDates">) => void
  deleteHabit: (id: string) => void
  reorderHabits: (draggedId: string, targetId: string) => void
  toggleHabit: (id: string, date: string) => void
}

export const HabitContext = createContext<HabitContextValue | null>(null)

export function useHabits(): HabitContextValue {
  const ctx = useContext(HabitContext)
  if (!ctx) throw new Error("useHabits must be used within a HabitProvider")
  return ctx
}
