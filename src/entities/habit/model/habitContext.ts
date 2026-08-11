import { createContext, useContext } from "react"
import type { Habit } from "./types"

export interface HabitContextValue {
  habits: Habit[]
  toggleHabit: (id: string, date: string) => void
}

export const HabitContext = createContext<HabitContextValue | null>(null)

export function useHabits(): HabitContextValue {
  const ctx = useContext(HabitContext)
  if (!ctx) throw new Error("useHabits must be used within a HabitProvider")
  return ctx
}
