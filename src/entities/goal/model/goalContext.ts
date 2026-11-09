import { createContext, useContext } from "react"
import type { Goal } from "./goal"

// Step operations take an optional `subgoalId`: without it they act on the
// goal's own steps, with it on that subgoal's steps (two-level tree).
export interface GoalContextValue {
  goals: Goal[]
  isLoaded: boolean
  // `steps` seeds the goal's own first steps in the same request (the
  // onboarding's "first step" field) — adding them afterwards with
  // addMilestone could race the create that hasn't reached the server yet.
  addGoal: (
    goal: Omit<Goal, "id" | "updatedAt" | "milestones" | "subgoals" | "progress">,
    steps?: string[],
  ) => void
  updateGoal: (id: string, patch: Partial<Omit<Goal, "id" | "updatedAt" | "milestones" | "subgoals">>) => void
  deleteGoal: (id: string) => void
  reorderGoals: (draggedId: string, targetId: string) => void
  addMilestone: (goalId: string, title: string, subgoalId?: string) => void
  updateMilestone: (goalId: string, milestoneId: string, title: string, subgoalId?: string) => void
  deleteMilestone: (goalId: string, milestoneId: string, subgoalId?: string) => void
  reorderMilestones: (goalId: string, draggedId: string, targetId: string, subgoalId?: string) => void
  toggleMilestone: (goalId: string, milestoneId: string, subgoalId?: string) => void
  addSubgoal: (goalId: string, title: string) => void
  renameSubgoal: (goalId: string, subgoalId: string, title: string) => void
  deleteSubgoal: (goalId: string, subgoalId: string) => void
  // Reorders the goal's top-level items — own steps and subgoals together.
  reorderGoalItems: (goalId: string, draggedId: string, targetId: string) => void
}

export const GoalContext = createContext<GoalContextValue | null>(null)

export function useGoals(): GoalContextValue {
  const ctx = useContext(GoalContext)
  if (!ctx) throw new Error("useGoals must be used within a GoalProvider")
  return ctx
}
