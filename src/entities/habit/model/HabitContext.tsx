import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react"
import { usePersistedCollection } from "@/shared/lib/storage/usePersistedCollection"
import { habitRepository } from "../api/habitRepository"
import type { Habit } from "./types"

interface HabitContextValue {
  habits: Habit[]
  toggleHabit: (id: string, date: string) => void
}

const HabitContext = createContext<HabitContextValue | null>(null)

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = usePersistedCollection<Habit>(habitRepository)

  const toggleHabit = useCallback((id: string, date: string) => {
    setHabits(hs => hs.map(h => {
      if (h.id !== id) return h
      const hasDate = h.completedDates.includes(date)
      return {
        ...h,
        completedDates: hasDate
          ? h.completedDates.filter(d => d !== date)
          : [...h.completedDates, date],
      }
    }))
  }, [setHabits])

  const value = useMemo(() => ({ habits, toggleHabit }), [habits, toggleHabit])

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>
}

export function useHabits(): HabitContextValue {
  const ctx = useContext(HabitContext)
  if (!ctx) throw new Error("useHabits must be used within a HabitProvider")
  return ctx
}
