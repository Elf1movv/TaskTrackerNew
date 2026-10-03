import { createContext, useContext } from "react"
import type { CalendarEntry, CalendarPlan } from "./plan"
export interface PlanContextValue {
  plans: CalendarEntry[]
  isLoaded: boolean
  addPlan: (plan: Omit<CalendarPlan, "id" | "updatedAt" | "createdAt">) => Promise<boolean>
  updatePlan: (id: string, patch: Partial<CalendarPlan>) => void
  deletePlan: (id: string) => void
  togglePlan: (id: string) => void
  refreshPlans: () => Promise<void>
}
export const PlanContext = createContext<PlanContextValue | null>(null)
export function usePlans() {
  const value = useContext(PlanContext)
  if (!value) throw new Error("PlanProvider required")
  return value
}
