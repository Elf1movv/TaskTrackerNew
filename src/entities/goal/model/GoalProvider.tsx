import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { reorderById } from "@/shared/lib/reorder"
import { usePersistedCollection } from "@/shared/lib/storage"
import { goalRepository } from "../api/goalRepository"
import { GoalContext } from "./goalContext"
import type { Goal } from "./goal"

function withRecomputedProgress(goal: Goal): Goal {
  const { milestones } = goal
  const progress = milestones.length
    ? Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100)
    : 0
  return { ...goal, progress }
}

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = usePersistedCollection<Goal>(goalRepository)

  const addGoal = useCallback(
    (goal: Omit<Goal, "id" | "milestones" | "progress">) => {
      setGoals(gs => [{ ...goal, id: generateId(), milestones: [], progress: 0 }, ...gs])
    },
    [setGoals],
  )

  const updateGoal = useCallback(
    (id: string, patch: Omit<Goal, "id" | "milestones" | "progress">) => {
      setGoals(gs => gs.map(g => (g.id === id ? { ...g, ...patch } : g)))
    },
    [setGoals],
  )

  const deleteGoal = useCallback(
    (id: string) => {
      setGoals(gs => gs.filter(g => g.id !== id))
    },
    [setGoals],
  )

  const reorderGoals = useCallback(
    (draggedId: string, targetId: string) => {
      setGoals(gs => reorderById(gs, draggedId, targetId))
    },
    [setGoals],
  )

  const addMilestone = useCallback(
    (goalId: string, title: string) => {
      setGoals(gs =>
        gs.map(g => {
          if (g.id !== goalId) return g
          const milestones = [...g.milestones, { id: generateId(), title, completed: false }]
          return withRecomputedProgress({ ...g, milestones })
        }),
      )
    },
    [setGoals],
  )

  const updateMilestone = useCallback(
    (goalId: string, milestoneId: string, title: string) => {
      setGoals(gs =>
        gs.map(g => {
          if (g.id !== goalId) return g
          const milestones = g.milestones.map(m => (m.id === milestoneId ? { ...m, title } : m))
          return { ...g, milestones }
        }),
      )
    },
    [setGoals],
  )

  const deleteMilestone = useCallback(
    (goalId: string, milestoneId: string) => {
      setGoals(gs =>
        gs.map(g => {
          if (g.id !== goalId) return g
          const milestones = g.milestones.filter(m => m.id !== milestoneId)
          return withRecomputedProgress({ ...g, milestones })
        }),
      )
    },
    [setGoals],
  )

  const reorderMilestones = useCallback(
    (goalId: string, draggedId: string, targetId: string) => {
      setGoals(gs =>
        gs.map(g =>
          g.id === goalId ? { ...g, milestones: reorderById(g.milestones, draggedId, targetId) } : g,
        ),
      )
    },
    [setGoals],
  )

  const toggleMilestone = useCallback(
    (goalId: string, milestoneId: string) => {
      setGoals(gs =>
        gs.map(g => {
          if (g.id !== goalId) return g
          const milestones = g.milestones.map(m =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m,
          )
          return withRecomputedProgress({ ...g, milestones })
        }),
      )
    },
    [setGoals],
  )

  const value = useMemo(
    () => ({
      goals,
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
