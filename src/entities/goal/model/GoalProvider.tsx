import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { reorderById } from "@/shared/lib/reorder"
import { usePersistedCollection } from "@/shared/lib/storage"
import { goalRepository } from "../api/goalRepository"
import { computeGoalProgress } from "../lib/computeGoalProgress"
import { GoalContext } from "./goalContext"
import type { Goal, Milestone, Subgoal } from "./goal"

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
    (goal: Omit<Goal, "id" | "updatedAt" | "milestones" | "subgoals" | "progress">) => {
      create({
        ...goal,
        id: generateId(),
        milestones: [],
        subgoals: [],
        progress: 0,
        updatedAt: new Date().toISOString(),
      })
    },
    [create],
  )

  const updateGoal = useCallback(
    (id: string, patch: Partial<Omit<Goal, "id" | "updatedAt" | "milestones" | "subgoals">>) =>
      update(id, patch),
    [update],
  )

  const deleteGoal = useCallback((id: string) => remove(id), [remove])

  const reorderGoals = useCallback(
    (draggedId: string, targetId: string) => reorder(reorderById(goals, draggedId, targetId)),
    [goals, reorder],
  )

  // Steps and subgoals live as JSON fields inside Goal, not separate tables
  // — every operation computes the new arrays locally and makes exactly one
  // update(goalId, ...) call, same as any other Goal field edit. Progress is
  // recomputed here for the optimistic view; the server recomputes it again
  // and its value wins (server/src/lib/goalProgress.ts).
  const saveTree = useCallback(
    (goal: Goal, milestones: Milestone[], subgoals: Subgoal[]) =>
      update(goal.id, { milestones, subgoals, progress: computeGoalProgress(milestones, subgoals) }),
    [update],
  )

  // A step operation on either the goal's own steps (subgoalId undefined)
  // or one subgoal's steps.
  const editSteps = useCallback(
    (goalId: string, subgoalId: string | undefined, edit: (steps: Milestone[]) => Milestone[]) => {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return
      if (!subgoalId) {
        saveTree(goal, edit(goal.milestones), goal.subgoals)
        return
      }
      const subgoals = goal.subgoals.map(s =>
        s.id === subgoalId ? { ...s, milestones: edit(s.milestones) } : s,
      )
      saveTree(goal, goal.milestones, subgoals)
    },
    [goals, saveTree],
  )

  const addMilestone = useCallback(
    (goalId: string, title: string, subgoalId?: string) =>
      editSteps(goalId, subgoalId, steps => [...steps, { id: generateId(), title, completed: false }]),
    [editSteps],
  )

  const updateMilestone = useCallback(
    (goalId: string, milestoneId: string, title: string, subgoalId?: string) =>
      editSteps(goalId, subgoalId, steps => steps.map(m => (m.id === milestoneId ? { ...m, title } : m))),
    [editSteps],
  )

  const deleteMilestone = useCallback(
    (goalId: string, milestoneId: string, subgoalId?: string) =>
      editSteps(goalId, subgoalId, steps => steps.filter(m => m.id !== milestoneId)),
    [editSteps],
  )

  const reorderMilestones = useCallback(
    (goalId: string, draggedId: string, targetId: string, subgoalId?: string) =>
      editSteps(goalId, subgoalId, steps => reorderById(steps, draggedId, targetId)),
    [editSteps],
  )

  const toggleMilestone = useCallback(
    (goalId: string, milestoneId: string, subgoalId?: string) =>
      editSteps(goalId, subgoalId, steps =>
        steps.map(m => (m.id === milestoneId ? { ...m, completed: !m.completed } : m)),
      ),
    [editSteps],
  )

  const editSubgoals = useCallback(
    (goalId: string, edit: (subgoals: Subgoal[]) => Subgoal[]) => {
      const goal = goals.find(g => g.id === goalId)
      if (goal) saveTree(goal, goal.milestones, edit(goal.subgoals))
    },
    [goals, saveTree],
  )

  const addSubgoal = useCallback(
    (goalId: string, title: string) =>
      editSubgoals(goalId, subgoals => [...subgoals, { id: generateId(), title, milestones: [] }]),
    [editSubgoals],
  )

  const renameSubgoal = useCallback(
    (goalId: string, subgoalId: string, title: string) =>
      editSubgoals(goalId, subgoals => subgoals.map(s => (s.id === subgoalId ? { ...s, title } : s))),
    [editSubgoals],
  )

  const deleteSubgoal = useCallback(
    (goalId: string, subgoalId: string) =>
      editSubgoals(goalId, subgoals => subgoals.filter(s => s.id !== subgoalId)),
    [editSubgoals],
  )

  const reorderSubgoals = useCallback(
    (goalId: string, draggedId: string, targetId: string) =>
      editSubgoals(goalId, subgoals => reorderById(subgoals, draggedId, targetId)),
    [editSubgoals],
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
      addSubgoal,
      renameSubgoal,
      deleteSubgoal,
      reorderSubgoals,
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
      addSubgoal,
      renameSubgoal,
      deleteSubgoal,
      reorderSubgoals,
    ],
  )

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>
}
