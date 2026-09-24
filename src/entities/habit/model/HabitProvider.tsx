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
    refresh,
  } = usePersistedCollection<Habit>(habitRepository, "habit")

  const addHabit = useCallback(
    (habit: Omit<Habit, "id" | "updatedAt" | "createdAt" | "completedDates" | "todayOrder">) => {
      // updatedAt/createdAt/todayOrder are placeholders here —
      // usePersistedCollection.create replaces them with the server's real
      // values (todayOrder included) once the request resolves.
      const now = new Date().toISOString()
      create({
        ...habit,
        id: generateId(),
        completedDates: [],
        todayOrder: 0,
        updatedAt: now,
        createdAt: now,
      })
    },
    [create],
  )

  const updateHabit = useCallback(
    (id: string, patch: Partial<Omit<Habit, "id" | "updatedAt" | "todayOrder">>) => update(id, patch),
    [update],
  )

  const deleteHabit = useCallback((id: string) => remove(id), [remove])

  const reorderHabitsInGroup = useCallback(
    (groupId: string, draggedId: string, targetId: string) => {
      const groupHabits = habits.filter(h => h.groupId === groupId)
      reorder(reorderById(groupHabits, draggedId, targetId))
    },
    [habits, reorder],
  )

  const moveHabitToGroup = useCallback(
    async (habitId: string, targetGroupId: string) => {
      const habit = habits.find(h => h.id === habitId)
      if (!habit || habit.groupId === targetGroupId) return
      // Awaited, not fired in parallel with reorder() below: update() and
      // reorder() are two separate request queues (see
      // usePersistedCollection.ts's pendingUpdates/pendingReorder), so
      // nothing serializes them against each other. Firing both at once let
      // reorder()'s server-side updatedAt bump land before update()'s PATCH
      // did, which then carried a now-stale expectedUpdatedAt and got a
      // false "changed elsewhere" conflict. Awaiting update() first means
      // reorder() only starts once this habit's updatedAt is settled.
      const movedHabit = await update(habitId, { groupId: targetGroupId })
      if (!movedHabit) return
      // Also re-sequences order so the moved habit lands at the end of its
      // new group instead of keeping whatever numeric order it had in its
      // old one (order is never exposed to the client as a raw number, so
      // "append" has to go through reorder() like this, not arithmetic).
      // Uses update()'s server-confirmed result, not the `habit` snapshot
      // from above — that snapshot's updatedAt is already stale by this
      // point, and feeding it into reorder()'s optimistic state would
      // silently overwrite the fresh value update() just applied, breaking
      // this same habit's *next* move with a real (not false) conflict.
      const targetGroupHabits = habits.filter(h => h.groupId === targetGroupId)
      reorder([...targetGroupHabits, movedHabit])
    },
    [habits, update, reorder],
  )

  // Today-page mirrors of the two above — same group membership (shared,
  // via `update(..., {groupId})`), but reorder against `todayOrder`
  // instead of `order` by passing habitRepository.reorderToday as
  // reorder()'s second argument. Same subset-of-one-group scoping, same
  // race-safety machinery, just a different column on the server.
  const reorderHabitsToday = useCallback(
    (groupId: string, draggedId: string, targetId: string) => {
      const groupHabits = habits.filter(h => h.groupId === groupId)
      reorder(reorderById(groupHabits, draggedId, targetId), habitRepository.reorderToday)
    },
    [habits, reorder],
  )

  const moveHabitToGroupToday = useCallback(
    async (habitId: string, targetGroupId: string) => {
      const habit = habits.find(h => h.id === habitId)
      if (!habit || habit.groupId === targetGroupId) return
      const movedHabit = await update(habitId, { groupId: targetGroupId })
      if (!movedHabit) return
      const targetGroupHabits = habits.filter(h => h.groupId === targetGroupId)
      reorder([...targetGroupHabits, movedHabit], habitRepository.reorderToday)
    },
    [habits, update, reorder],
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
    () => ({
      habits,
      addHabit,
      updateHabit,
      deleteHabit,
      reorderHabitsInGroup,
      moveHabitToGroup,
      reorderHabitsToday,
      moveHabitToGroupToday,
      toggleHabit,
      refreshHabits: refresh,
    }),
    [
      habits,
      addHabit,
      updateHabit,
      deleteHabit,
      reorderHabitsInGroup,
      moveHabitToGroup,
      reorderHabitsToday,
      moveHabitToGroupToday,
      toggleHabit,
      refresh,
    ],
  )

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>
}
