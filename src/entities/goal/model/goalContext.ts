import { createContext, useContext } from "react"
import type { Goal } from "./goal"

export interface GoalContextValue {
  goals: Goal[]
  addGoal: (goal: Omit<Goal, "id" | "updatedAt" | "milestones" | "progress">) => void
  updateGoal: (id: string, patch: Partial<Omit<Goal, "id" | "updatedAt" | "milestones">>) => void
  deleteGoal: (id: string) => void
  reorderGoals: (draggedId: string, targetId: string) => void
  addMilestone: (goalId: string, title: string) => void
  updateMilestone: (goalId: string, milestoneId: string, title: string) => void
  deleteMilestone: (goalId: string, milestoneId: string) => void
  reorderMilestones: (goalId: string, draggedId: string, targetId: string) => void
  toggleMilestone: (goalId: string, milestoneId: string) => void
}

export const GoalContext = createContext<GoalContextValue | null>(null)

export function useGoals(): GoalContextValue {
  const ctx = useContext(GoalContext)
  if (!ctx) throw new Error("useGoals must be used within a GoalProvider")
  return ctx
}
