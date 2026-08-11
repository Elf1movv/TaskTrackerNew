import { createContext, useContext } from "react"
import type { GoalListItem } from "@/widgets/goal-list"

export interface GoalsContextValue {
  goals: GoalListItem[]
}

export const GoalsContext = createContext<GoalsContextValue | null>(null)

export function useGoalsContext(): GoalsContextValue {
  const ctx = useContext(GoalsContext)
  if (!ctx) throw new Error("useGoalsContext must be used within a GoalsProvider")
  return ctx
}
