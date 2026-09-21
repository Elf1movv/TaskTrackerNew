import { createContext, useContext } from "react"
import type { Habit } from "./habit"

export interface HabitContextValue {
  habits: Habit[]
  addHabit: (habit: Omit<Habit, "id" | "updatedAt" | "createdAt" | "completedDates">) => void
  updateHabit: (id: string, patch: Partial<Omit<Habit, "id" | "updatedAt">>) => void
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
