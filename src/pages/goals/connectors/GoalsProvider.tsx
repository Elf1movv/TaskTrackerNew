import { useMemo, type ReactNode } from "react"
import { useGoals } from "@/entities/goal"
import { useLanguage } from "@/shared/lib/i18n"
import { formatTargetDate } from "../lib/formatTargetDate"
import { GoalsContext } from "./goalsContext"

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { goals } = useGoals()
  const { language } = useLanguage()

  const value = useMemo(
    () => ({
      goals: goals.map(goal => ({ ...goal, dueLabel: formatTargetDate(goal.targetDate, language) })),
    }),
    [goals, language],
  )

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
}
