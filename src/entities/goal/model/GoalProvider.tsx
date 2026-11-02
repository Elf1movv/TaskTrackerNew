import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { reorderById } from "@/shared/lib/reorder"
import { usePersistedCollection } from "@/shared/lib/storage"
import { goalRepository } from "../api/goalRepository"
import { GoalContext } from "./goalContext"
import type { Goal } from "./goal"

function computeProgress(milestones: Goal["milestones"]): number {
  return milestones.length
    ? Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100)
    : 0
}

export function GoalProvider({ children }: { children: ReactNode }) {
  const {
    items: goals,
    isLoaded,
    create,
    update,
    remove,
    reorder,
  } = usePersistedCollection<Goal>(goalRepository, "goal")

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

  // Milestones live as a JSON field inside Goal, not a separate table — so
  // every milestone operation just computes a new `milestones` array (and
  // recomputed `progress`) locally, then makes exactly one call to
  // update(goalId, ...), same as any other Goal field edit. No separate
  // milestone endpoints exist on the backend.
  const addMilestone = useCallback(
    (goalId: string, title: string) => {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return
      const milestones = [...goal.milestones, { id: generateId(), title, completed: false }]
      update(goalId, { milestones, progress: computeProgress(milestones) })
    },
    [goals, update],
  )

  const updateMilestone = useCallback(
    (goalId: string, milestoneId: string, title: string) => {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return
      const milestones = goal.milestones.map(m => (m.id === milestoneId ? { ...m, title } : m))
      update(goalId, { milestones })
    },
    [goals, update],
  )

  const deleteMilestone = useCallback(
    (goalId: string, milestoneId: string) => {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return
      const milestones = goal.milestones.filter(m => m.id !== milestoneId)
      update(goalId, { milestones, progress: computeProgress(milestones) })
    },
    [goals, update],
  )

  const reorderMilestones = useCallback(
    (goalId: string, draggedId: string, targetId: string) => {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return
      update(goalId, { milestones: reorderById(goal.milestones, draggedId, targetId) })
    },
    [goals, update],
  )

  const toggleMilestone = useCallback(
    (goalId: string, milestoneId: string) => {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return
      const milestones = goal.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m,
      )
      update(goalId, { milestones, progress: computeProgress(milestones) })
    },
    [goals, update],
  )

  const value = useMemo(
    () => ({
      goals,
      isLoaded,
      addGoal,
      updateGoal,
      deleteGoal,
      reorderGoals,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      reorderMilestones,
      toggleMilestone,
    }),
    [
      goals,
      isLoaded,
      addGoal,
      updateGoal,
      deleteGoal,
      reorderGoals,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      reorderMilestones,
      toggleMilestone,
    ],
  )

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>
}
