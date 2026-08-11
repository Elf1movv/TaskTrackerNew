import { useMemo, type ReactNode } from "react"
import { useGoals } from "@/entities/goal"
import { formatTargetDate } from "../utilits/formatTargetDate"
import { GoalsContext } from "./goalsContext"

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
