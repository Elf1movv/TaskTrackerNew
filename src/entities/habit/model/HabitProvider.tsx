import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { reorderById } from "@/shared/lib/reorder"
import { usePersistedCollection } from "@/shared/lib/storage"
import { habitRepository } from "../api/habitRepository"
import { HabitContext } from "./habitContext"
import type { Habit } from "./habit"

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = usePersistedCollection<Habit>(habitRepository)

  const addHabit = useCallback(
    (habit: Omit<Habit, "id" | "completedDates">) => {
      setHabits(hs => [{ ...habit, id: generateId(), completedDates: [] }, ...hs])
    },
    [setHabits],
  )

  const updateHabit = useCallback(
    (id: string, patch: Omit<Habit, "id" | "completedDates">) => {
      setHabits(hs => hs.map(h => (h.id === id ? { ...h, ...patch } : h)))
    },
    [setHabits],
  )

  const deleteHabit = useCallback(
    (id: string) => {
      setHabits(hs => hs.filter(h => h.id !== id))
    },
    [setHabits],
  )

  const reorderHabits = useCallback(
    (draggedId: string, targetId: string) => {
      setHabits(hs => reorderById(hs, draggedId, targetId))
    },
    [setHabits],
  )

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

  const value = useMemo(
    () => ({ habits, addHabit, updateHabit, deleteHabit, reorderHabits, toggleHabit }),
    [habits, addHabit, updateHabit, deleteHabit, reorderHabits, toggleHabit],
  )

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>
}
