import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react"
import { usePersistedCollection } from "@/shared/lib/storage/usePersistedCollection"
import { goalRepository } from "../api/goalRepository"
import type { Goal } from "./types"

interface GoalContextValue {
  goals: Goal[]
  toggleMilestone: (goalId: string, milestoneId: string) => void
}

const GoalContext = createContext<GoalContextValue | null>(null)

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = usePersistedCollection<Goal>(goalRepository)

  const toggleMilestone = useCallback((goalId: string, milestoneId: string) => {
    setGoals(gs => gs.map(g => {
      if (g.id !== goalId) return g
      const milestones = g.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m,
      )
      const progress = Math.round(
        (milestones.filter(m => m.completed).length / milestones.length) * 100,
      )
      return { ...g, milestones, progress }
    }))
  }, [setGoals])

  const value = useMemo(() => ({ goals, toggleMilestone }), [goals, toggleMilestone])

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>
}

export function useGoals(): GoalContextValue {
  const ctx = useContext(GoalContext)
  if (!ctx) throw new Error("useGoals must be used within a GoalProvider")
  return ctx
}
