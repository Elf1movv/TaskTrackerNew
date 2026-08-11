import { useCallback, useMemo, type ReactNode } from "react"
import { usePersistedCollection } from "@/shared/lib/storage/usePersistedCollection"
import { habitRepository } from "../api/habitRepository"
import { HabitContext } from "./habitContext"
import type { Habit } from "./types"

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = usePersistedCollection<Habit>(habitRepository)

  const toggleHabit = useCallback(
    (id: string, date: string) => {
      setHabits(hs =>
        hs.map(h => {
          if (h.id !== id) return h
          const hasDate = h.completedDates.includes(date)
          return {
            ...h,
            completedDates: hasDate ? h.completedDates.filter(d => d !== date) : [...h.completedDates, date],
          }
        }),
      )
    },
    [setHabits],
  )

  const value = useMemo(() => ({ habits, toggleHabit }), [habits, toggleHabit])

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>
}
