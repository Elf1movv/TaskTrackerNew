import { createContext, useContext } from "react"
import type { Goal } from "./types"

export interface GoalContextValue {
  goals: Goal[]
  toggleMilestone: (goalId: string, milestoneId: string) => void
}

export const GoalContext = createContext<GoalContextValue | null>(null)

export function useGoals(): GoalContextValue {
  const ctx = useContext(GoalContext)
  if (!ctx) throw new Error("useGoals must be used within a GoalProvider")
  return ctx
}
