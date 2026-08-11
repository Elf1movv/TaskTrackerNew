import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useGoals } from "@/entities/goal"
import type { GoalListItem } from "@/widgets/goal-list"
import { formatTargetDate } from "../utilits/formatTargetDate"

interface GoalsContextValue {
  goals: GoalListItem[]
}

const GoalsContext = createContext<GoalsContextValue | null>(null)

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { goals } = useGoals()

  const value = useMemo(
    () => ({
      goals: goals.map(goal => ({ ...goal, dueLabel: formatTargetDate(goal.targetDate) })),
    }),
    [goals],
  )

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
}

export function useGoalsContext(): GoalsContextValue {
  const ctx = useContext(GoalsContext)
  if (!ctx) throw new Error("useGoalsContext must be used within a GoalsProvider")
  return ctx
}
