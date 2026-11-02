import { useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { createRestRepository, usePersistedCollection } from "@/shared/lib/storage"
import { PlanContext } from "./planContext"
import type { CalendarPlan } from "./plan"
const repository = createRestRepository<CalendarPlan>(`${import.meta.env.VITE_API_URL}/plans`)
export function PlanProvider({ children }: { children: ReactNode }) {
  const { items, isLoaded, create, update, remove, refresh } = usePersistedCollection(repository, "plan")
  const value = useMemo(() => {
    const plans = items.map(plan => ({ ...plan, dueDate: plan.date, completedAt: null }))
    return {
      plans,
      isLoaded,
      updatePlan: update,
      deletePlan: remove,
      refreshPlans: refresh,
      addPlan: (plan: Omit<CalendarPlan, "id" | "createdAt" | "updatedAt">) => {
        const now = new Date().toISOString()
        return create({ ...plan, id: generateId(), createdAt: now, updatedAt: now })
      },
      togglePlan: (id: string) => {
        const plan = plans.find(p => p.id === id)
        if (!plan) return
        void update(id, { completed: !plan.completed })
      },
    }
  }, [items, isLoaded, create, update, remove, refresh])
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}
