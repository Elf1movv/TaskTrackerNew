import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { reorderById } from "@/shared/lib/reorder"
import { usePersistedCollection } from "@/shared/lib/storage"
import { habitRepository } from "../api/habitRepository"
import { HabitContext } from "./habitContext"
import type { Habit } from "./habit"

export function HabitProvider({ children }: { children: ReactNode }) {
  const {
    items: habits,
    create,
    update,
    remove,
    reorder,
  } = usePersistedCollection<Habit>(habitRepository, "habit")

  const addHabit = useCallback(
    (habit: Omit<Habit, "id" | "updatedAt" | "completedDates">) => {
      create({
        ...habit,
        id: generateId(),
        completedDates: [],
        updatedAt: new Date().toISOString(),
      })
    },
    [create],
  )

  const updateHabit = useCallback(
    (id: string, patch: Partial<Omit<Habit, "id" | "updatedAt">>) => update(id, patch),
    [update],
  )

  const deleteHabit = useCallback((id: string) => remove(id), [remove])

  const reorderHabits = useCallback(
    (draggedId: string, targetId: string) => reorder(reorderById(habits, draggedId, targetId)),
    [habits, reorder],
  )

  const toggleHabit = useCallback(
    (id: string, date: string) => {
      const habit = habits.find(h => h.id === id)
      if (!habit) return
      const hasDate = habit.completedDates.includes(date)
      const completedDates = hasDate
        ? habit.completedDates.filter(d => d !== date)
        : [...habit.completedDates, date]
      update(id, { completedDates })
    },
    [habits, update],
  )

  const value = useMemo(
    () => ({ habits, addHabit, updateHabit, deleteHabit, reorderHabits, toggleHabit }),
    [habits, addHabit, updateHabit, deleteHabit, reorderHabits, toggleHabit],
  )

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>
}
