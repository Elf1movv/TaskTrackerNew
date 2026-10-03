import { useMemo, type ReactNode } from "react"
import { useTasks } from "@/entities/task/@x/calendar-plan"
import { generateId } from "@/shared/lib/id"
import { createRestRepository, usePersistedCollection } from "@/shared/lib/storage"
import { PlanContext } from "./planContext"
import type { CalendarPlan } from "./plan"
const repository = createRestRepository<CalendarPlan>(`${import.meta.env.VITE_API_URL}/plans`)
export function PlanProvider({ children }: { children: ReactNode }) {
  const { items, isLoaded, create, update, remove, refresh } = usePersistedCollection(repository, "plan")
  const { tasks, toggleTask } = useTasks()
  const value = useMemo(() => {
    const plans = items.map(plan => {
      const task = plan.taskId ? tasks.find(t => t.id === plan.taskId) : undefined
      return {
        ...plan,
        ...(task
          ? {
              title: task.title,
              description: task.description,
              completed: task.completed,
              category: task.category,
              priority: task.priority,
            }
          : {}),
        dueDate: plan.date,
        completedAt: task?.completedAt ?? null,
      }
    })
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
        if (plan.taskId) toggleTask(plan.taskId)
        else void update(id, { completed: !plan.completed })
      },
    }
  }, [items, tasks, toggleTask, isLoaded, create, update, remove, refresh])
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}
