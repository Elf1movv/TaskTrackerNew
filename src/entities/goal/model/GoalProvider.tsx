import { useTasks } from "@/entities/task/@x/goal"
import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { reorderById } from "@/shared/lib/reorder"
import { usePersistedCollection } from "@/shared/lib/storage"
import { goalRepository } from "../api/goalRepository"
import { GoalContext } from "./goalContext"
import type { Goal } from "./goal"

export function GoalProvider({ children }: { children: ReactNode }) {
  const {
    items: storedGoals,
    isLoaded,
    create,
    update,
    remove,
    reorder,
  } = usePersistedCollection<Goal>(goalRepository, "goal")

  const { tasks } = useTasks()
  const goals = useMemo(
    () =>
      storedGoals.map(goal => {
        const linked = tasks.filter(task => task.goalId === goal.id && !task.legacyPending)
        return {
          ...goal,
          progress: linked.length
            ? Math.round((linked.filter(task => task.completed).length / linked.length) * 100)
            : 0,
        }
      }),
    [storedGoals, tasks],
  )

  const addGoal = useCallback(
    (goal: Omit<Goal, "id" | "updatedAt" | "milestones" | "progress">) => {
      create({
        ...goal,
        id: generateId(),
        milestones: [],
        progress: 0,
        updatedAt: new Date().toISOString(),
      })
    },
    [create],
  )

  const updateGoal = useCallback(
    (id: string, patch: Partial<Omit<Goal, "id" | "updatedAt" | "milestones">>) => update(id, patch),
    [update],
  )

  const deleteGoal = useCallback((id: string) => remove(id), [remove])

  const reorderGoals = useCallback(
    (draggedId: string, targetId: string) => reorder(reorderById(goals, draggedId, targetId)),
    [goals, reorder],
  )

  const value = useMemo(
    () => ({
      goals,
      isLoaded,
      addGoal,
      updateGoal,
      deleteGoal,
      reorderGoals,
    }),
    [goals, isLoaded, addGoal, updateGoal, deleteGoal, reorderGoals],
  )

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>
}
