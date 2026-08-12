import { useCallback, useMemo, type ReactNode } from "react"
import { usePersistedCollection } from "@/shared/lib/storage"
import { goalRepository } from "../api/goalRepository"
import { GoalContext } from "./goalContext"
import type { Goal } from "./goal"

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = usePersistedCollection<Goal>(goalRepository)

  const toggleMilestone = useCallback(
    (goalId: string, milestoneId: string) => {
      setGoals(gs =>
        gs.map(g => {
          if (g.id !== goalId) return g
          const milestones = g.milestones.map(m =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m,
          )
          const progress = Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100)
          return { ...g, milestones, progress }
        }),
      )
    },
    [setGoals],
  )

  const value = useMemo(() => ({ goals, toggleMilestone }), [goals, toggleMilestone])

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>
}
